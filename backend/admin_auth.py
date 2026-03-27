import os
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
import jwt
import bcrypt
import logging
from dotenv import load_dotenv
from database import get_db
from admin_models import AdminAccount
from settings import require_secret, is_production


logger = logging.getLogger("unimart.admin")

load_dotenv()

ADMIN_JWT_SECRET = os.getenv("ADMIN_JWT_SECRET", "change-this-admin-secret-in-production")
ADMIN_TOKEN_EXPIRE = timedelta(hours=8)

if is_production():
    ADMIN_JWT_SECRET = require_secret("ADMIN_JWT_SECRET", min_len=32)

_bearer = HTTPBearer()

bcrypt_context = type("_bcrypt", (), {
    "hash": staticmethod(lambda pw: bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()),
    "verify": staticmethod(lambda pw, hashed: bcrypt.checkpw(pw.encode(), hashed.encode())),
})()


def create_admin_token(admin: AdminAccount) -> str:
    payload = {
        "sub": str(admin.id),
        "username": admin.username,
        "role": admin.role,
        "token_type": "admin",
        "exp": datetime.now(timezone.utc) + ADMIN_TOKEN_EXPIRE,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, ADMIN_JWT_SECRET, algorithm="HS256")


def decode_admin_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, ADMIN_JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Admin token expired — please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid admin token")
    if payload.get("token_type") != "admin":
        raise HTTPException(403, "Token type mismatch — not an admin token")
    return payload


def get_current_admin(
    credentials=Depends(_bearer),
    db: Session = Depends(get_db),
) -> AdminAccount:
    payload = decode_admin_token(credentials.credentials)
    admin = db.query(AdminAccount).filter(
        AdminAccount.id == int(payload["sub"]),
        AdminAccount.is_active == True,
    ).first()
    if not admin:
        raise HTTPException(401, "Admin account deactivated or not found")
    return admin


def seed_super_admin(db: Session) -> None:
    """Seed the super admin account on startup. Updates password if admin exists."""
    username = os.getenv("ADMIN_USERNAME", "superadmin")
    password = os.getenv("ADMIN_PASSWORD")
    if not password:
        raise RuntimeError("ADMIN_PASSWORD env variable is not set. Refusing to start.")

    existing_admin = db.query(AdminAccount).filter_by(username=username).first()
    if existing_admin:
        # Update password to match current env value (allows password changes via .env)
        existing_admin.hashed_password = bcrypt_context.hash(password)
        existing_admin.display_name = os.getenv("ADMIN_DISPLAY_NAME", "Super Admin")
        db.commit()
        logger.info("Super admin '%s' password updated from environment", username)
    else:
        db.add(AdminAccount(
            username=username,
            hashed_password=bcrypt_context.hash(password),
            display_name=os.getenv("ADMIN_DISPLAY_NAME", "Super Admin"),
        ))
        db.commit()
        logger.info("Super admin '%s' created", username)
