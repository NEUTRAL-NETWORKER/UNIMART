import os
import random
import re
import secrets
import time
import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import OfficialRecord, UserProfile
from schemas import (
    UserSignup, UserLogin, UserUpdate,
    TokenResponse, OfficialRecordResponse, UserDashboardResponse
)
from security import hash_password, verify_password, create_access_token
from dependencies import get_current_user
from services.email_service import send_registration_otp_email
from redis_client import redis_client
from settings import require_secret, is_production

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


def log_user_activity(db, register_number: str, username: str, action: str, details: str = None, ip: str = None):
    """Log user activity events (login, registration, order events) without crashing the main flow."""
    try:
        from models import UserActivityLog
        log = UserActivityLog(
            register_number=register_number,
            username=username,
            action=action,
            details=details,
            ip_address=ip,
        )
        db.add(log)
        db.commit()
    except Exception as e:
        # Log but don't crash the main flow
        logger.debug(f"Activity logging failed: {type(e).__name__}: {e}")


def _get_client_ip(request: Request) -> str:
    """Extract client IP from request headers."""
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None

REFRESH_TOKEN_EXPIRE = timedelta(days=7)
REFRESH_SECRET = os.getenv("REFRESH_TOKEN_SECRET", "change-this-refresh-secret")

if is_production():
    REFRESH_SECRET = require_secret("REFRESH_TOKEN_SECRET", min_len=32)

OTP_EXPIRY_SECONDS = 600  # 10 minutes
VERIFIED_EMAIL_EXPIRY = 1800  # 30 minutes — how long a verified email stays valid
RATE_LIMIT_WINDOW = 900  # 15 minutes
RATE_LIMIT_MAX_SENDS = 5  # max OTP sends per email per window
RATE_LIMIT_MAX_ATTEMPTS = 5  # max OTP verify attempts per email


def create_refresh_token(register_number: str) -> str:
    from datetime import datetime, timezone
    import jwt as pyjwt
    return pyjwt.encode(
        {
            "sub": register_number,
            "token_type": "refresh",
            "exp": datetime.now(timezone.utc) + REFRESH_TOKEN_EXPIRE,
        },
        REFRESH_SECRET,
        algorithm="HS256",
    )


class RegistrationOTPRequest(BaseModel):
    email: str
    register_number: str


class RegistrationOTPVerify(BaseModel):
    email: str
    otp: str


# ============================================================
# GET /auth/verify/{register_number} — Auto-fill workflow
# ============================================================

@router.get("/verify/{register_number}", response_model=OfficialRecordResponse)
def verify_register_number(register_number: str, db: Session = Depends(get_db)):
    """
    Lookup a register number in the Official Master Registry.
    Returns university, college, department info for auto-fill.
    """
    record = db.query(OfficialRecord).filter(
        OfficialRecord.register_number == register_number.upper()
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Register number not found in official records"
        )

    return record


# ============================================================
# POST /auth/send-registration-otp — Send OTP to email
# ============================================================

@router.post("/send-registration-otp")
async def send_registration_otp(
    data: RegistrationOTPRequest,
):
    """
    Generate a 6-digit OTP and send it to the student's email for registration verification.
    Rate limited: max 5 sends per email per 15 minutes.
    """
    if not redis_client:
        raise HTTPException(
            status_code=500, detail="Redis connection failed. OTP cannot be stored."
        )

    # Rate limiting: check how many OTPs have been sent to this email recently
    rate_key = f"otp_rate:{data.email}"
    send_count = redis_client.get(rate_key)
    if send_count and int(send_count) >= RATE_LIMIT_MAX_SENDS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Please wait 15 minutes before trying again."
        )

    otp = str(secrets.randbelow(900000) + 100000)
    
    # Store OTP in Redis with expiration
    redis_client.setex(f"reg_otp:{data.email}", OTP_EXPIRY_SECONDS, otp)
    
    # Reset attempt counter for this new OTP
    redis_client.delete(f"otp_attempts:{data.email}")

    # Increment rate limit counter
    if send_count:
        redis_client.incr(rate_key)
    else:
        redis_client.setex(rate_key, RATE_LIMIT_WINDOW, 1)

    try:
        await send_registration_otp_email(
            to_email=data.email,
            otp_code=otp,
            student_id=data.register_number,
        )
    except Exception as e:
        logger.exception("Error sending registration OTP to %s", data.email)
        raise HTTPException(
            status_code=500, detail="Failed to send OTP email. Please try again later."
        )

    return {"sent": True, "message": f"OTP sent to {data.email}"}


# ============================================================
# POST /auth/verify-registration-otp — Verify the email OTP
# ============================================================

@router.post("/verify-registration-otp")
def verify_registration_otp(data: RegistrationOTPVerify):
    """
    Verify the OTP entered by the user during registration.
    Rate limited: max 5 attempts per email before OTP is invalidated.
    """
    if not redis_client:
         raise HTTPException(status_code=500, detail="Redis is not connected.")

    # Check attempt count
    attempt_key = f"otp_attempts:{data.email}"
    attempts = redis_client.get(attempt_key)
    if attempts and int(attempts) >= RATE_LIMIT_MAX_ATTEMPTS:
        # Invalidate OTP after too many failed attempts
        redis_client.delete(f"reg_otp:{data.email}")
        redis_client.delete(attempt_key)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. OTP has been invalidated. Please request a new one."
        )

    stored_otp = redis_client.get(f"reg_otp:{data.email}")

    if not stored_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP is invalid or has expired. Please request a new one."
        )

    if stored_otp != data.otp:
        # Increment attempt counter
        if attempts:
            redis_client.incr(attempt_key)
        else:
            redis_client.setex(attempt_key, OTP_EXPIRY_SECONDS, 1)
        
        remaining = RATE_LIMIT_MAX_ATTEMPTS - (int(attempts or 0) + 1)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP. {remaining} attempt(s) remaining."
        )

    # OTP verified -- remove OTP from Redis and mark email as verified temporarily
    redis_client.delete(f"reg_otp:{data.email}")
    redis_client.delete(attempt_key)
    redis_client.setex(f"reg_verified:{data.email}", VERIFIED_EMAIL_EXPIRY, "true")

    return {"verified": True, "message": "Email verified successfully!"}


# ============================================================
# POST /auth/register — Signup
# ============================================================

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(data: UserSignup, request: Request, db: Session = Depends(get_db)):
    """
    Register a new user.
    1. Verify register_number exists in OfficialRecord
    2. Check if user already registered
    3. Hash password, create UserProfile
    4. Return JWT token
    """
    # Step 0: Validate phone number format (if provided)
    if data.phone_number:
        cleaned_phone = data.phone_number.strip()
        if cleaned_phone and not re.match(r'^[6-9]\d{9}$', cleaned_phone):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid phone number. Must be a 10-digit Indian mobile number."
            )

    # Step 0.5: Verify email was OTP-verified
    email = data.personal_mail_id.strip()
    
    if not redis_client:
         raise HTTPException(status_code=500, detail="Redis is not connected.")

    is_verified = redis_client.get(f"reg_verified:{email}")
    
    if not is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email has not been verified. Please complete OTP verification first."
        )
    # Consume the verification (one-time use)
    redis_client.delete(f"reg_verified:{email}")

    # Step 1: Verify against Official DB
    reg_number = data.register_number.strip().upper()
    official = db.query(OfficialRecord).filter(
        OfficialRecord.register_number == reg_number
    ).first()

    if not official:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Register number not found in official records. Cannot register."
        )

    # Step 2: Check if already registered
    existing = db.query(UserProfile).filter(
        UserProfile.register_number == reg_number
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account already exists for this register number."
        )

    # Step 3: Check username uniqueness
    username_exists = db.query(UserProfile).filter(
        UserProfile.username == data.username
    ).first()

    if username_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This username is already taken."
        )

    # Step 4: Create user
    new_user = UserProfile(
        register_number=reg_number,
        username=data.username,
        hashed_password=hash_password(data.password),
        personal_mail_id=data.personal_mail_id,
        phone_number=data.phone_number,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log registration activity
    log_user_activity(db, new_user.register_number, new_user.username, "USER_REGISTERED",
                      details=f"Registered with email {new_user.personal_mail_id}",
                      ip=_get_client_ip(request))

    # Step 5: Generate JWT
    token = create_access_token(data={"sub": new_user.register_number})

    return {
        "token": token,
        "refresh_token": create_refresh_token(new_user.register_number),
        "user": {
            "studentId": new_user.register_number,
            "username": new_user.username,
            "fullName": official.full_name,
            "university": official.university,
            "college": official.college,
            "department": official.department,
            "personalMailId": new_user.personal_mail_id,
            "phoneNumber": new_user.phone_number,
            "profilePictureUrl": new_user.profile_picture_url,
            "usernameChangeCount": new_user.username_change_count,
        }
    }


# ============================================================
# POST /auth/login — Login
# ============================================================

@router.post("/login", response_model=TokenResponse)
def login_user(data: UserLogin, request: Request, db: Session = Depends(get_db)):
    """
    Authenticate user with register number (studentId) and password.
    Returns JWT token + user data (joined from both tables).
    """
    # Find user by register number OR username
    identifier = data.studentId.strip()
    user = db.query(UserProfile).filter(
        UserProfile.register_number == identifier.upper()
    ).first()
    if not user:
        # Fallback: try matching by username (case-sensitive)
        user = db.query(UserProfile).filter(
            UserProfile.username == identifier
        ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid register number or password"
        )

    # Verify password
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid register number or password"
        )

    # Get official data for the joined response
    official = db.query(OfficialRecord).filter(
        OfficialRecord.register_number == user.register_number
    ).first()

    # Log login activity
    log_user_activity(db, user.register_number, user.username, "USER_LOGIN",
                      ip=_get_client_ip(request))

    # Generate JWT
    token = create_access_token(data={"sub": user.register_number})

    return {
        "token": token,
        "refresh_token": create_refresh_token(user.register_number),
        "user": {
            "studentId": user.register_number,
            "username": user.username,
            "fullName": official.full_name if official else "",
            "university": official.university if official else "",
            "college": official.college if official else "",
            "department": official.department if official else "",
            "personalMailId": user.personal_mail_id,
            "phoneNumber": user.phone_number,
            "profilePictureUrl": user.profile_picture_url,
            "usernameChangeCount": user.username_change_count,
            "createdAt": str(user.created_at) if user.created_at else None,
        }
    }


# ============================================================
# POST /auth/refresh — Exchange refresh token for new access token
# ============================================================

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/refresh")
async def refresh_access_token(data: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access token."""
    import jwt as pyjwt
    try:
        payload = pyjwt.decode(data.refresh_token, REFRESH_SECRET, algorithms=["HS256"])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired — please log in again")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if payload.get("token_type") != "refresh":
        raise HTTPException(status_code=403, detail="Token type mismatch")

    user = db.query(UserProfile).filter_by(register_number=payload["sub"]).first()
    if not user or getattr(user, "is_suspended", False):
        raise HTTPException(status_code=401, detail="User not found or suspended")

    token = create_access_token(data={"sub": user.register_number})
    return {"access_token": token, "token_type": "bearer"}


# ============================================================
# GET /auth/profile — Get current user dashboard (JOIN)
# ============================================================

@router.get("/profile")
def get_profile(current_user: UserProfile = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns the combined dashboard data by JOINing OfficialRecord + UserProfile.
    """
    official = db.query(OfficialRecord).filter(
        OfficialRecord.register_number == current_user.register_number
    ).first()

    return {
        "studentId": current_user.register_number,
        "username": current_user.username,
        "fullName": official.full_name if official else "",
        "university": official.university if official else "",
        "college": official.college if official else "",
        "department": official.department if official else "",
        "officialEmail": official.official_email if official else "",
        "personalMailId": current_user.personal_mail_id,
        "phoneNumber": current_user.phone_number,
        "profilePictureUrl": current_user.profile_picture_url,
        "usernameChangeCount": current_user.username_change_count,
        "createdAt": str(current_user.created_at) if current_user.created_at else None,
    }


# ============================================================
# PUT /auth/profile — Update user profile
# ============================================================

@router.put("/profile")
def update_profile(
    data: UserUpdate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update editable fields in UserProfile.
    If username is changed, increment username_change_count.
    """
    if data.username and data.username != current_user.username:
        # Check uniqueness
        username_exists = db.query(UserProfile).filter(
            UserProfile.username == data.username,
            UserProfile.register_number != current_user.register_number
        ).first()

        if username_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This username is already taken."
            )

        current_user.username = data.username
        current_user.username_change_count += 1

    if data.personal_mail_id is not None:
        current_user.personal_mail_id = data.personal_mail_id

    if data.phone_number is not None:
        current_user.phone_number = data.phone_number

    if data.profile_picture_url is not None:
        current_user.profile_picture_url = data.profile_picture_url

    db.commit()
    db.refresh(current_user)

    return {
        "studentId": current_user.register_number,
        "username": current_user.username,
        "personalMailId": current_user.personal_mail_id,
        "phoneNumber": current_user.phone_number,
        "profilePictureUrl": current_user.profile_picture_url,
        "usernameChangeCount": current_user.username_change_count,
    }
