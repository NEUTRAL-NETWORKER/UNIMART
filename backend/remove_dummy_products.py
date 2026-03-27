"""
Remove dummy/sample products that were added for testing order placement.
This cleans up the database by removing the test data.
"""
import sys
sys.path.append('.')

from database import SessionLocal
from models import Product, Order
import traceback

def remove_dummy_products():
    """Remove the sample products that were added for testing."""
    db = SessionLocal()

    try:
        print("Removing dummy/sample products...")

        # List of dummy product titles to remove
        dummy_product_titles = [
            "MacBook Air M1",
            "Calculus Textbook",
            "Gaming Chair",
            "Scientific Calculator",
            "Study Lamp"
        ]

        removed_count = 0
        for title in dummy_product_titles:
            # Find products with this title
            products = db.query(Product).filter(Product.title == title).all()

            for product in products:
                print(f"Removing product: {product.title} (ID: {product.id}) by {product.seller_register_number}")

                # Check if there are any orders for this product
                orders = db.query(Order).filter(Order.product_id == product.id).all()
                if orders:
                    print(f"  - Product has {len(orders)} orders, removing them first...")
                    for order in orders:
                        print(f"    Removing order ID: {order.id}")
                        db.delete(order)

                # Remove the product
                db.delete(product)
                removed_count += 1

        db.commit()
        print(f"SUCCESS: Removed {removed_count} dummy products!")

        # Show remaining products
        remaining_products = db.query(Product).all()
        print(f"\nRemaining products in database: {len(remaining_products)}")
        for prod in remaining_products:
            print(f"  - ID: {prod.id}, Title: {prod.title}, Status: {prod.product_status}, Seller: {prod.seller_register_number}")

        return True

    except Exception as e:
        print(f"ERROR: Failed to remove dummy products: {e}")
        traceback.print_exc()
        db.rollback()
        return False

    finally:
        db.close()

if __name__ == "__main__":
    print("CLEANING: Removing dummy product data...")
    print("=" * 50)

    success = remove_dummy_products()

    if success:
        print("\nSUCCESS: Dummy products removed successfully!")
        print("Database cleaned up.")
    else:
        print("\nFAILED: Could not remove dummy products. Please check the errors above.")
        sys.exit(1)