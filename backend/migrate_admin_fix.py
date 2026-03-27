"""
Migration script to add order cancellation fields.
Run this to fix the admin module database errors.
"""
import sys
sys.path.append('.')

from database import engine, SessionLocal, get_db
from sqlalchemy import text
import traceback

def migrate_order_cancellation_fields():
    """Add missing cancellation fields to orders table"""
    db = SessionLocal()

    try:
        print("Starting migration: Adding order cancellation fields...")

        # Check if columns already exist
        result = db.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'orders'
            AND column_name IN ('cancelled_at', 'cancelled_by', 'cancellation_reason')
        """))
        existing_columns = [row[0] for row in result.fetchall()]
        print(f"Existing cancellation columns: {existing_columns}")

        # Add missing columns
        columns_to_add = [
            ('cancelled_at', 'TIMESTAMP WITH TIME ZONE'),
            ('cancelled_by', 'VARCHAR(10)'),
            ('cancellation_reason', 'TEXT')
        ]

        added_count = 0
        for col_name, col_type in columns_to_add:
            if col_name not in existing_columns:
                print(f"Adding column: {col_name} ({col_type})")
                db.execute(text(f"""
                    ALTER TABLE orders
                    ADD COLUMN {col_name} {col_type}
                """))
                added_count += 1
            else:
                print(f"Column {col_name} already exists, skipping")

        db.commit()
        print(f"SUCCESS: Migration completed! Added {added_count} columns.")
        return True

    except Exception as e:
        print(f"ERROR: Migration failed: {e}")
        traceback.print_exc()
        db.rollback()
        return False

    finally:
        db.close()

def migrate_notifications_table():
    """Create notifications table if it doesn't exist"""
    db = SessionLocal()

    try:
        print("Checking notifications table...")

        # Check if notifications table exists
        result = db.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name = 'notifications'
        """))
        table_exists = result.fetchone() is not None

        if not table_exists:
            print("Creating notifications table...")
            db.execute(text("""
                CREATE TABLE notifications (
                    id SERIAL PRIMARY KEY,
                    user_register_number VARCHAR(10) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    message TEXT NOT NULL,
                    order_id INTEGER,
                    is_read BOOLEAN DEFAULT FALSE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    FOREIGN KEY (user_register_number) REFERENCES user_profiles (register_number),
                    FOREIGN KEY (order_id) REFERENCES orders (id)
                )
            """))

            # Add index on user_register_number for fast queries
            db.execute(text("""
                CREATE INDEX idx_notifications_user_register_number
                ON notifications (user_register_number)
            """))

            db.commit()
            print("SUCCESS: Notifications table created!")
        else:
            print("Notifications table already exists")

        return True

    except Exception as e:
        print(f"ERROR: Notifications migration failed: {e}")
        traceback.print_exc()
        db.rollback()
        return False

    finally:
        db.close()

if __name__ == "__main__":
    print("RUNNING: Database migrations for admin module fixes...")
    print("=" * 50)

    success1 = migrate_order_cancellation_fields()
    success2 = migrate_notifications_table()

    if success1 and success2:
        print("\nSUCCESS: All migrations completed successfully!")
        print("The admin module should now work correctly.")
    else:
        print("\nFAILED: Some migrations failed. Please check the errors above.")
        sys.exit(1)