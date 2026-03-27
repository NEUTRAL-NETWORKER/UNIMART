"""
Quick fix: Restore products with cancelled orders back to AVAILABLE.
Run this after backend restart.
"""
from database import SessionLocal
from models import Product, Order, ProductStatus, OrderStatus

def quick_fix():
    db = SessionLocal()
    try:
        print("\n" + "="*60)
        print("  QUICK FIX: Restore Products with Cancelled Orders")
        print("="*60 + "\n")

        # Get all RESERVED products
        reserved_products = db.query(Product).filter(
            Product.product_status == ProductStatus.RESERVED
        ).all()

        if not reserved_products:
            print("✅ No reserved products found.")
            return

        print(f"Found {len(reserved_products)} RESERVED product(s):\n")
        fixed = 0

        for product in reserved_products:
            # Check for ACTIVE orders (PENDING or CONFIRMED)
            active_order = db.query(Order).filter(
                Order.product_id == product.id,
                Order.order_status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED])
            ).first()

            if not active_order:
                # No active orders - restore to AVAILABLE
                print(f"📦 Product ID {product.id}: '{product.title}'")
                print(f"   Status: RESERVED → AVAILABLE")

                # Get cancelled/completed orders for info
                all_orders = db.query(Order).filter(Order.product_id == product.id).all()
                print(f"   Orders: {len(all_orders)} total")
                for order in all_orders:
                    print(f"     - Order #{order.id}: {order.order_status}")

                product.product_status = ProductStatus.AVAILABLE
                fixed += 1
                print(f"   ✅ FIXED!\n")
            else:
                print(f"📦 Product ID {product.id}: '{product.title}'")
                print(f"   Has active order #{active_order.id} ({active_order.order_status})")
                print(f"   ⚠️ Skipped (has active order)\n")

        if fixed > 0:
            db.commit()
            print("="*60)
            print(f"🎉 Successfully restored {fixed} product(s) to AVAILABLE!")
            print("="*60 + "\n")
        else:
            print("="*60)
            print("ℹ️  No products needed fixing.")
            print("="*60 + "\n")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    quick_fix()
