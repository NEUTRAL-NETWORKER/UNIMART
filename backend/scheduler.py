"""
Background Scheduler for automated cleanup tasks.
Uses APScheduler to run periodic jobs.

Tasks:
1. Delete SOLD_OUT products older than 7 days (runs every 24 hours)
2. Delete chat messages for completed orders older than 24 hours
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import logging
from database import SessionLocal
from models import Product, ChatMessage, Order, ProductStatus, OrderStatus


logger = logging.getLogger("unimart.scheduler")


def cleanup_sold_out_products():
    """
    Soft-delete products that have been in SOLD_OUT status for more than 7 days.
    Marks them as DELETED instead of removing rows (preserves FK integrity with orders).
    Runs every 24 hours.
    """
    db: Session = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)

        sold_products = db.query(Product).filter(
            Product.product_status == ProductStatus.SOLD_OUT,
            Product.sold_at != None,
            Product.sold_at < cutoff
        ).all()

        count = len(sold_products)
        for product in sold_products:
            product.product_status = ProductStatus.DELETED

        db.commit()

        if count > 0:
            logger.info("Deleted %s sold-out products older than 7 days (soft-delete)", count)
        else:
            logger.info("No sold-out products to clean up")

    except Exception as e:
        logger.exception("Error in cleanup job")
        db.rollback()
    finally:
        db.close()


def cleanup_expired_chats():
    """
    Delete chat messages for orders that were completed more than 24 hours ago.
    This implements the "chat disappears 24h after completion" requirement.
    """
    db: Session = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

        # Find completed orders older than 24 hours
        expired_orders = db.query(Order).filter(
            Order.order_status == OrderStatus.COMPLETED,
            Order.completed_at != None,
            Order.completed_at < cutoff
        ).all()

        total_deleted = 0
        for order in expired_orders:
            messages = db.query(ChatMessage).filter(
                ChatMessage.order_id == order.id
            ).all()

            for msg in messages:
                db.delete(msg)
                total_deleted += 1

        db.commit()

        if total_deleted > 0:
            logger.info(
                "Deleted %s expired chat messages from %s completed orders",
                total_deleted,
                len(expired_orders),
            )
        else:
            logger.info("No expired chat messages to clean up")

    except Exception as e:
        logger.exception("Error in chat cleanup job")
        db.rollback()
    finally:
        db.close()


# ============================================================
# SCHEDULER INITIALIZATION
# ============================================================

scheduler = BackgroundScheduler()


def start_scheduler():
    """Start the background scheduler with all cleanup jobs."""

    # Run product cleanup every 24 hours
    scheduler.add_job(
        cleanup_sold_out_products,
        trigger=IntervalTrigger(hours=24),
        id="cleanup_sold_out_products",
        name="Delete SOLD_OUT products older than 7 days",
        replace_existing=True,
    )

    # Run chat cleanup every 1 hour
    scheduler.add_job(
        cleanup_expired_chats,
        trigger=IntervalTrigger(hours=1),
        id="cleanup_expired_chats",
        name="Delete chat messages from completed orders (24h expiry)",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Background scheduler started")
    logger.info("Product cleanup interval: every 24 hours")
    logger.info("Chat cleanup interval: every 1 hour")


def stop_scheduler():
    """Gracefully stop the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
