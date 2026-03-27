"""
One-time fix: Restore products that are stuck in SOLD_OUT status
but have only cancelled orders (no active orders).

This happens when an order is completed (product → SOLD_OUT) then cancelled,
but the old cancellation logic didn't restore SOLD_OUT products.
"""
from database import SessionLocal
from models import Product, Order, ProductStatus, OrderStatus
from sqlalchemy import and_

def fix_stuck_products():
    db = SessionLocal()
    try:
        # Find products that are SOLD_OUT
        sold_out_products = db.query(Product).filter(
            Product.product_status == ProductStatus.SOLD_OUT
        ).all()

        fixed_count = 0

        for product in sold_out_products:
            # Check if this product has any non-cancelled orders
            active_orders = db.query(Order).filter(
                and_(
                    Order.product_id == product.id,
                    Order.order_status.in_([
                        OrderStatus.PENDING,
                        OrderStatus.CONFIRMED,
                        OrderStatus.COMPLETED
                    ])
                )
            ).first()

            # If no active orders, this product should be available
            if not active_orders:
                print(f"⚠️  Found stuck product: ID={product.id}, Title='{product.title}'")
                product.product_status = ProductStatus.AVAILABLE
                fixed_count += 1
                print(f"✅ Restored product ID={product.id} to AVAILABLE")

        if fixed_count > 0:
            db.commit()
            print(f"\n🎉 Successfully restored {fixed_count} product(s)")
        else:
            print("✅ No stuck products found. All products are in correct state.")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("  FIX STUCK PRODUCTS - Unimart")
    print("=" * 60)
    print()
    fix_stuck_products()
    print()
    print("=" * 60)
