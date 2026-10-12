import sys
from core.database import Base, engine, SessionLocal
from models.user import User
from models.product import Product
from core.security import get_password_hash

SEEDED_PRODUCTS = [
    # 1. Mobiles and Electronics
    {
        "name": "Apple iPhone 15 Pro Max 256GB Natural Titanium",
        "category": "Mobiles and Electronics",
        "price": 1199.99,
        "stock": 25,
        "description": "Aerospace-grade titanium design with A17 Pro chip, 48MP main camera, and USB-C with USB 3 speeds.",
        "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Samsung Galaxy S24 Ultra 5G AI Smartphone",
        "category": "Mobiles and Electronics",
        "price": 1299.99,
        "stock": 18,
        "description": "Built-in S Pen, Snapdragon 8 Gen 3 with Galaxy AI, 200MP camera, and titanium frame.",
        "image_url": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Apple MacBook Pro 16 M3 Max Space Black",
        "category": "Mobiles and Electronics",
        "price": 2499.00,
        "stock": 12,
        "description": "Liquid Retina XDR display, up to 128GB unified memory, and 22-hour battery life for pro workflows.",
        "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80"
    },

    # 2. Deals and Savings
    {
        "name": "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
        "category": "Deals and Savings",
        "price": 349.99,
        "stock": 30,
        "description": "Industry-leading active noise canceling with 30-hour battery life and crystal-clear hands-free calling.",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Anker Fast Charging USB-C 65W GaN Wall Adapter",
        "category": "Deals and Savings",
        "price": 39.99,
        "stock": 55,
        "description": "Ultra-compact high-speed multi-device charger powered by advanced GaN II technology.",
        "image_url": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Amazon Kindle Paperwhite 16GB Waterproof E-Reader",
        "category": "Deals and Savings",
        "price": 139.99,
        "stock": 22,
        "description": "6.8-inch glare-free display, adjustable warm light, and up to 10 weeks of battery life.",
        "image_url": "https://images.unsplash.com/photo-1592496001020-d31bd830651f?w=600&auto=format&fit=crop&q=80"
    },

    # 3. Fashion
    {
        "name": "Classic Italian Tailored Leather Trench Coat",
        "category": "Fashion",
        "price": 289.00,
        "stock": 15,
        "description": "Handcrafted genuine leather coat with tailored stitching, silk-touch lining, and weather protection.",
        "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Minimalist Pure Linen Casual Button-Down Shirt",
        "category": "Fashion",
        "price": 65.00,
        "stock": 40,
        "description": "Breathable 100% French linen weave designed for effortless casual sophistication and comfort.",
        "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Vintage Distressed Denim Jacket with Sherpa Collar",
        "category": "Fashion",
        "price": 98.50,
        "stock": 25,
        "description": "Durable heavy-wash denim outer with insulated fleece collar and timeless brass hardware.",
        "image_url": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80"
    },

    # 4. Home and Furniture
    {
        "name": "Ergonomic Mesh High-Back Executive Office Chair",
        "category": "Home and Furniture",
        "price": 249.00,
        "stock": 20,
        "description": "Breathable 3D mesh with adjustable lumbar support, 4D armrests, and 135-degree synchro-tilt recline.",
        "image_url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Scandinavian Solid Oak Minimalist Dining Table",
        "category": "Home and Furniture",
        "price": 420.00,
        "stock": 8,
        "description": "Sustainably sourced white oak dining table with matte protective lacquer and tapered legs.",
        "image_url": "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Modern Ceramic Artisan Warm Ambient Table Lamp",
        "category": "Home and Furniture",
        "price": 79.99,
        "stock": 35,
        "description": "Handcrafted textured ceramic base with linen drum shade and warm-glow LED dimmer bulb included.",
        "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80"
    },

    # 5. Groceries and Pet Supplies
    {
        "name": "Organic Cold-Pressed Extra Virgin Olive Oil 1L",
        "category": "Groceries and Pet Supplies",
        "price": 24.99,
        "stock": 80,
        "description": "Single-origin cold-pressed olive oil rich in polyphenols and antioxidants from Mediterranean orchards.",
        "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Artisan Roasted Arabica Whole Bean Coffee 1kg",
        "category": "Groceries and Pet Supplies",
        "price": 28.50,
        "stock": 65,
        "description": "Single-origin Ethiopian Yirgacheffe medium roast with tasting notes of dark chocolate and citrus.",
        "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Premium Grain-Free Wild Salmon Dog Nutrition 5kg",
        "category": "Groceries and Pet Supplies",
        "price": 48.00,
        "stock": 40,
        "description": "High-protein grain-free formula enriched with omega-3 fatty acids for canine joint and coat vitality.",
        "image_url": "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&auto=format&fit=crop&q=80"
    },

    # 6. Books and Education
    {
        "name": "Designing Data-Intensive Applications Hardcover",
        "category": "Books and Education",
        "price": 49.99,
        "stock": 45,
        "description": "The definitive guide to distributed data systems, consistency models, and reliability engineering.",
        "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Clean Code: Handbook of Agile Software Craftsmanship",
        "category": "Books and Education",
        "price": 42.50,
        "stock": 35,
        "description": "Learn best practices of writing clean, maintainable, and testable code from software engineering pioneers.",
        "image_url": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Atomic Habits by James Clear Collectors Edition",
        "category": "Books and Education",
        "price": 26.99,
        "stock": 60,
        "description": "An easy and proven way to build good habits and break bad ones with actionable behavioral frameworks.",
        "image_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80"
    },

    # 7. Games and Live Shopping
    {
        "name": "PlayStation 5 Pro Console DualSense Bundle",
        "category": "Games and Live Shopping",
        "price": 699.99,
        "stock": 14,
        "description": "4K 120Hz ray-traced gaming console with ultra-fast 2TB SSD and haptic feedback wireless controller.",
        "image_url": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Nintendo Switch OLED Model Neon Red & Blue",
        "category": "Games and Live Shopping",
        "price": 349.99,
        "stock": 22,
        "description": "7-inch vivid OLED display, wide adjustable stand, enhanced audio, and 64GB internal storage.",
        "image_url": "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Xbox Wireless Controller Carbon Black with USB-C",
        "category": "Games and Live Shopping",
        "price": 59.99,
        "stock": 40,
        "description": "Textured grip on triggers, bumpers, and back-case with hybrid D-pad and Bluetooth cross-play support.",
        "image_url": "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=600&auto=format&fit=crop&q=80"
    },

    # 8. Pharmacy and Household
    {
        "name": "Smart UV-C True HEPA Air Purifier 360",
        "category": "Pharmacy and Household",
        "price": 149.00,
        "stock": 28,
        "description": "Medical-grade H13 HEPA filter capturing 99.97% of airborne allergens, pollen, dust, and VOC odors.",
        "image_url": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Digital Infrared Non-Contact Medical Thermometer",
        "category": "Pharmacy and Household",
        "price": 34.99,
        "stock": 50,
        "description": "Instant 1-second temperature readout with color-coded fever warning display and 32 memory recalls.",
        "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Comprehensive Emergency First Aid Kit 150-Piece",
        "category": "Pharmacy and Household",
        "price": 44.50,
        "stock": 65,
        "description": "Hospital-grade bandages, antiseptic wipes, burn dressings, and trauma scissors in compact waterproof case.",
        "image_url": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=80"
    },

    # 9. Travel and Auto
    {
        "name": "All-Weather Aviation Hardshell Carry-On Luggage",
        "category": "Travel and Auto",
        "price": 179.99,
        "stock": 25,
        "description": "Polycarbonate spinner suitcase with TSA-approved combination locks and silent 360-degree wheels.",
        "image_url": "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Ultra 4K Dual Dash Cam with Night Vision & GPS",
        "category": "Travel and Auto",
        "price": 129.00,
        "stock": 32,
        "description": "Front and rear dual recording with Sony Starvis sensor, 24-hour parking monitor, and WiFi phone sync.",
        "image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Waterproof Heavy-Duty Camping Backpack 50L",
        "category": "Travel and Auto",
        "price": 89.99,
        "stock": 38,
        "description": "Ripstop nylon expedition pack with ergonomic weight-distribution harness and integrated rain cover.",
        "image_url": "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&auto=format&fit=crop&q=80"
    },

    # 10. Toys and Kids
    {
        "name": "STEM Robotic Engineering Discovery Kit",
        "category": "Toys and Kids",
        "price": 69.95,
        "stock": 42,
        "description": "Programmable robotic building set with Bluetooth sensor modules and graphical block coding guide.",
        "image_url": "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Classic Natural Wooden Building Blocks Set 100pc",
        "category": "Toys and Kids",
        "price": 39.50,
        "stock": 48,
        "description": "Solid beechwood non-toxic geometric blocks encouraging spatial creativity and motor coordination.",
        "image_url": "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Plush Organic Cotton Cuddle Teddy Bear 40cm",
        "category": "Toys and Kids",
        "price": 24.99,
        "stock": 55,
        "description": "Hypoallergenic soft organic cotton plush bear with embroidered details safe for all ages.",
        "image_url": "https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=600&auto=format&fit=crop&q=80"
    },

    # 11. Sports and Fitness
    {
        "name": "Titanium GPS Multi-Sport Smart Fitness Watch",
        "category": "Sports and Fitness",
        "price": 329.00,
        "stock": 19,
        "description": "Dual-frequency GPS, ECG monitor, sapphire crystal glass, and 100m water resistance for endurance training.",
        "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Nike Air Zoom Pegasus Road Running Shoes",
        "category": "Sports and Fitness",
        "price": 130.00,
        "stock": 35,
        "description": "Responsive React foam midsole with dual Zoom Air units providing springy energy return on every stride.",
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "High-Density Non-Slip Eco Yoga Mat with Strap",
        "category": "Sports and Fitness",
        "price": 45.00,
        "stock": 50,
        "description": "6mm premium TPE dual-layer mat offering superior cushioning, grip, and alignment guidance.",
        "image_url": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&auto=format&fit=crop&q=80"
    },

    # 12. Beauty
    {
        "name": "Hydrating Hyaluronic Acid Botanical Serum 50ml",
        "category": "Beauty",
        "price": 38.50,
        "stock": 55,
        "description": "Triple-weight molecular hyaluronic acid with antioxidant vitamin C and green tea extracts for deep hydration.",
        "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Rose Damascena Refreshing Facial Toner Mist 150ml",
        "category": "Beauty",
        "price": 26.00,
        "stock": 60,
        "description": "Steam-distilled pure organic rosewater balancing skin pH and delivering revitalizing hydration.",
        "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Luxury Satin Velvet Matte Lipstick Red Dahlia",
        "category": "Beauty",
        "price": 29.50,
        "stock": 45,
        "description": "Long-wear richly pigmented formula enriched with jojoba seed oil and shea butter for velvety lips.",
        "image_url": "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80"
    },

    # 13. Gifting
    {
        "name": "Luxury Artisanal Godiva Truffles Gift Box 36pc",
        "category": "Gifting",
        "price": 54.00,
        "stock": 40,
        "description": "Assorted gourmet Belgian dark, milk, and white chocolate pralines presented in an embossed gold keepsake box.",
        "image_url": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Scented Soy Wax Aromatherapy Candle Gift Set",
        "category": "Gifting",
        "price": 38.00,
        "stock": 50,
        "description": "Hand-poured pure soy wax infused with French lavender, vanilla bourbon, and cedar essential oils.",
        "image_url": "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Handmade Preserved Crimson Rose in Glass Dome",
        "category": "Gifting",
        "price": 65.00,
        "stock": 25,
        "description": "100% natural eternal rose preserved with organic resin, resting on solid wood base with LED fairy lights.",
        "image_url": "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&auto=format&fit=crop&q=80"
    },

    # 14. Business Purchases
    {
        "name": "Commercial Heavy-Duty Thermal Label Printer",
        "category": "Business Purchases",
        "price": 189.99,
        "stock": 16,
        "description": "High-speed 150mm/s direct thermal 4x6 shipping and barcode printer compatible with all fulfillment portals.",
        "image_url": "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Executive Italian Leather Briefcase & Organizer",
        "category": "Business Purchases",
        "price": 220.00,
        "stock": 20,
        "description": "Full-grain leather with padded 16-inch laptop compartment, organizer pockets, and detachable shoulder strap.",
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "High-Speed Ultra 4K Conference Auto-Framing Cam",
        "category": "Business Purchases",
        "price": 159.00,
        "stock": 24,
        "description": "Dual noise-canceling stereo mics, AI speaker tracking, and HDR video sensor for executive boardroom meetings.",
        "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80"
    },

    # 15. Everyday Needs
    {
        "name": "Bamboo Eco-Fiber Ultra Soft Bath Towel Set 4-Pack",
        "category": "Everyday Needs",
        "price": 42.00,
        "stock": 45,
        "description": "100% natural organic bamboo rayon towels offering unmatched softness, maximum absorbency, and quick drying.",
        "image_url": "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Double-Wall Insulated Stainless Steel Tumbler 750ml",
        "category": "Everyday Needs",
        "price": 24.99,
        "stock": 70,
        "description": "Food-grade 18/8 stainless steel flask keeping beverages ice cold for 24 hours or steaming hot for 12 hours.",
        "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Natural Aloe & Lavender Hand Wash Refill Pouch 1L",
        "category": "Everyday Needs",
        "price": 15.50,
        "stock": 85,
        "description": "Sulfate-free hydrating liquid soap formula enriched with vitamin E and soothing natural botanical extracts.",
        "image_url": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80"
    },

    # 16. Bills and Recharges
    {
        "name": "Digital Smart Utility Meter & Fast Recharge Voucher",
        "category": "Bills and Recharges",
        "price": 50.00,
        "stock": 999,
        "description": "Instant prepaid electricity, fiber broadband, and smart utility auto-recharge credit token with zero fees.",
        "image_url": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Ultra-Fast 5G Fiber Broadband Monthly Top-Up 300Mbps",
        "category": "Bills and Recharges",
        "price": 65.00,
        "stock": 999,
        "description": "Unlimited high-speed gigabit fiber data allowance voucher with priority symmetrical upload bandwidth.",
        "image_url": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80"
    },
    {
        "name": "Metro Transit & EV Smart Charging Mobility Pass",
        "category": "Bills and Recharges",
        "price": 40.00,
        "stock": 999,
        "description": "Universal contactless transit pass and electric vehicle supercharging digital credit card voucher.",
        "image_url": "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format&fit=crop&q=80"
    }
]


from sqlalchemy import text


def seed_database():
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'General'"))
            conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER"))
            conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DOUBLE PRECISION DEFAULT 0.0"))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS order_items (
                    id SERIAL PRIMARY KEY,
                    order_id INTEGER,
                    product_id INTEGER,
                    quantity INTEGER NOT NULL,
                    price_at_purchase DOUBLE PRECISION NOT NULL
                )
            """))
        except Exception:
            pass
    db = SessionLocal()
    try:
        # Check / Create default Admin
        admin = db.query(User).filter(User.email == "admin@rmart.com").first()
        if not admin:
            admin = User(
                email="admin@rmart.com",
                hashed_password=get_password_hash("ADMIN-2026"),
                full_name="R-Mart System Administrator",
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("Created default admin: admin@rmart.com / ADMIN-2026")

        # Check / Create default Customer
        customer = db.query(User).filter(User.email == "customer@rmart.com").first()
        if not customer:
            customer = User(
                email="customer@rmart.com",
                hashed_password=get_password_hash("customer123"),
                full_name="Alex Customer",
                role="customer"
            )
            db.add(customer)
            db.commit()
            print("Created default customer: customer@rmart.com / customer123")

        # Clean up any legacy placeholder products that don't match our standard catalog
        seeded_names = {item["name"] for item in SEEDED_PRODUCTS}
        legacy_products = db.query(Product).filter(~Product.name.in_(seeded_names)).all()
        if legacy_products:
            for lp in legacy_products:
                db.delete(lp)
            db.commit()
            print(f"Removed {len(legacy_products)} legacy/placeholder products.")

        # Seed / Update Products across all 16 categories
        inserted_count = 0
        updated_count = 0
        for item in SEEDED_PRODUCTS:
            existing = db.query(Product).filter(Product.name == item["name"]).first()
            if not existing:
                prod = Product(
                    name=item["name"],
                    category=item["category"],
                    price=item["price"],
                    stock=item["stock"],
                    description=item["description"],
                    image_url=item["image_url"]
                )
                db.add(prod)
                inserted_count += 1
            else:
                existing.category = item["category"]
                existing.price = item["price"]
                existing.stock = item["stock"]
                existing.description = item["description"]
                existing.image_url = item["image_url"]
                updated_count += 1

        db.commit()
        print(f"Database sync complete: {inserted_count} inserted, {updated_count} updated. Total: {len(SEEDED_PRODUCTS)} products across 16 R-Mart categories.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
