"""
Database migration script for notifications and order cancellation fields.
Run this after restarting the backend to add the new columns and table.
"""
from sqlalchemy import text
from database import engine

def run_migration():
    print("=" * 60)
    print("  DATABASE MIGRATION: Notifications & Order Cancellation")
    print("=" * 60)
    print()

    with engine.connect() as conn:
        # 1. Add cancellation fields to orders table
        print("1. Adding cancellation fields to orders table...")
        try:
            conn.execute(text("""
                ALTER TABLE orders
                ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
                ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR,
                ADD COLUMN IF NOT EXISTS cancellation_reason TEXT
            """))
            conn.commit()
            print("   ✅ Cancellation fields added to orders table")
        except Exception as e:
            print(f"   ⚠️  Skipped (may already exist): {e}")

        # 2. Create notifications table
        print("\n2. Creating notifications table...")
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    user_register_number VARCHAR NOT NULL REFERENCES user_profiles(register_number),
                    type VARCHAR(50) NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    message TEXT NOT NULL,
                    order_id INTEGER REFERENCES orders(id),
                    is_read BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()
            print("   ✅ Notifications table created")
        except Exception as e:
            print(f"   ⚠️  Skipped (may already exist): {e}")

        # 2b. Repair legacy notifications schema (older table may miss new columns)
        print("\n2b. Repairing legacy notifications schema...")
        try:
            conn.execute(text("""
                ALTER TABLE notifications
                ADD COLUMN IF NOT EXISTS type VARCHAR(50),
                ADD COLUMN IF NOT EXISTS title VARCHAR(200),
                ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES orders(id)
            """))

            # Backfill defaults for old rows before enforcing NOT NULL.
            conn.execute(text("""
                UPDATE notifications
                SET type = 'SYSTEM'
                WHERE type IS NULL
            """))
            conn.execute(text("""
                UPDATE notifications
                SET title = 'Notification'
                WHERE title IS NULL
            """))

            conn.execute(text("""
                ALTER TABLE notifications
                ALTER COLUMN type SET NOT NULL,
                ALTER COLUMN title SET NOT NULL
            """))
            conn.commit()
            print("   ✅ Legacy notifications schema repaired")
        except Exception as e:
            print(f"   ⚠️  Skipped schema repair: {e}")

        # 3. Create index for faster notification lookups
        print("\n3. Creating indexes...")
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_notifications_user
                ON notifications(user_register_number)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_notifications_unread
                ON notifications(user_register_number, is_read)
                WHERE is_read = FALSE
            """))
            conn.commit()
            print("   ✅ Indexes created")
        except Exception as e:
            print(f"   ⚠️  Skipped (may already exist): {e}")

    print()
    print("=" * 60)
    print("  MIGRATION COMPLETE!")
    print("=" * 60)
    print()
    print("New features available:")
    print("  - In-app notifications for order events")
    print("  - Order cancellation with reasons")
    print("  - Notification bell in navbar")
    print()

if __name__ == "__main__":
    run_migration()
