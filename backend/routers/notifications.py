from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from models import Notification, NotificationType, UserProfile
from dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ============================================================
# Schemas
# ============================================================

class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    order_id: Optional[int]
    is_read: bool
    created_at: str

    class Config:
        from_attributes = True


# ============================================================
# Helper: Create notification (used internally by other routers)
# ============================================================

def create_notification(
    db: Session,
    user_register_number: str,
    notification_type: str,
    title: str,
    message: str,
    order_id: Optional[int] = None
):
    """Helper function to create a notification for a user."""
    notification = Notification(
        user_register_number=user_register_number,
        type=notification_type,
        title=title,
        message=message,
        order_id=order_id,
        is_read=False
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


# ============================================================
# GET /notifications — List user's notifications
# ============================================================

@router.get("/")
def get_notifications(
    limit: int = 20,
    offset: int = 0,
    unread_only: bool = False,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all notifications for the current user."""
    query = db.query(Notification).filter(
        Notification.user_register_number == current_user.register_number
    )

    if unread_only:
        query = query.filter(Notification.is_read == False)

    notifications = query.order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()

    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "order_id": n.order_id,
            "is_read": n.is_read,
            "created_at": str(n.created_at) if n.created_at else None
        }
        for n in notifications
    ]


# ============================================================
# GET /notifications/unread-count — Get unread count
# ============================================================

@router.get("/unread-count")
def get_unread_count(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications."""
    count = db.query(Notification).filter(
        Notification.user_register_number == current_user.register_number,
        Notification.is_read == False
    ).count()

    return {"count": count}


# ============================================================
# PUT /notifications/{id}/read — Mark single notification as read
# ============================================================

@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_register_number == current_user.register_number
    ).first()

    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notification.is_read = True
    db.commit()

    return {"success": True}


# ============================================================
# PUT /notifications/read-all — Mark all notifications as read
# ============================================================

@router.put("/read-all")
def mark_all_as_read(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for the current user."""
    db.query(Notification).filter(
        Notification.user_register_number == current_user.register_number,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()

    return {"success": True}


# ============================================================
# DELETE /notifications/{id} — Delete a notification
# ============================================================

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification."""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_register_number == current_user.register_number
    ).first()

    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    db.delete(notification)
    db.commit()

    return {"success": True}
