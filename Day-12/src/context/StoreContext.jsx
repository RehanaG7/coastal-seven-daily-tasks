import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/apiClient";

const StoreContext = createContext();

const FULL_CATALOG = [
  {
    "id": 1,
    "name": "Apple iPhone 15 Pro Max 256GB Natural Titanium",
    "title": "Apple iPhone 15 Pro Max 256GB Natural Titanium",
    "price": 1199.99,
    "stock": 25,
    "category": "Mobiles and Electronics",
    "image": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80",
    "description": "Aerospace-grade titanium design with A17 Pro chip, 48MP main camera, and USB-C with USB 3 speeds."
  },
  {
    "id": 2,
    "name": "Samsung Galaxy S24 Ultra 5G AI Smartphone",
    "title": "Samsung Galaxy S24 Ultra 5G AI Smartphone",
    "price": 1299.99,
    "stock": 18,
    "category": "Mobiles and Electronics",
    "image": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80",
    "description": "Built-in S Pen, Snapdragon 8 Gen 3 with Galaxy AI, 200MP camera, and titanium frame."
  },
  {
    "id": 3,
    "name": "Apple MacBook Pro 16 M3 Max Space Black",
    "title": "Apple MacBook Pro 16 M3 Max Space Black",
    "price": 2499.0,
    "stock": 12,
    "category": "Mobiles and Electronics",
    "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
    "description": "Liquid Retina XDR display, up to 128GB unified memory, and 22-hour battery life for pro workflows."
  },
  {
    "id": 4,
    "name": "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
    "title": "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
    "price": 349.99,
    "stock": 30,
    "category": "Deals and Savings",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    "description": "Industry-leading active noise canceling with 30-hour battery life and crystal-clear hands-free calling."
  },
  {
    "id": 5,
    "name": "Anker Fast Charging USB-C 65W GaN Wall Adapter",
    "title": "Anker Fast Charging USB-C 65W GaN Wall Adapter",
    "price": 39.99,
    "stock": 55,
    "category": "Deals and Savings",
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
    "description": "Ultra-compact high-speed multi-device charger powered by advanced GaN II technology."
  },
  {
    "id": 6,
    "name": "Amazon Kindle Paperwhite 16GB Waterproof E-Reader",
    "title": "Amazon Kindle Paperwhite 16GB Waterproof E-Reader",
    "price": 139.99,
    "stock": 22,
    "category": "Deals and Savings",
    "image": "https://images.unsplash.com/photo-1592496001020-d31bd830651f?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1592496001020-d31bd830651f?w=600&auto=format&fit=crop&q=80",
    "description": "6.8-inch glare-free display, adjustable warm light, and up to 10 weeks of battery life."
  },
  {
    "id": 7,
    "name": "Classic Italian Tailored Leather Trench Coat",
    "title": "Classic Italian Tailored Leather Trench Coat",
    "price": 289.0,
    "stock": 15,
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    "description": "Handcrafted genuine leather coat with tailored stitching, silk-touch lining, and weather protection."
  },
  {
    "id": 8,
    "name": "Minimalist Pure Linen Casual Button-Down Shirt",
    "title": "Minimalist Pure Linen Casual Button-Down Shirt",
    "price": 65.0,
    "stock": 40,
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80",
    "description": "Breathable 100% French linen weave designed for effortless casual sophistication and comfort."
  },
  {
    "id": 9,
    "name": "Vintage Distressed Denim Jacket with Sherpa Collar",
    "title": "Vintage Distressed Denim Jacket with Sherpa Collar",
    "price": 98.5,
    "stock": 25,
    "category": "Fashion",
    "image": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80",
    "description": "Durable heavy-wash denim outer with insulated fleece collar and timeless brass hardware."
  },
  {
    "id": 10,
    "name": "Ergonomic Mesh High-Back Executive Office Chair",
    "title": "Ergonomic Mesh High-Back Executive Office Chair",
    "price": 249.0,
    "stock": 20,
    "category": "Home and Furniture",
    "image": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80",
    "description": "Breathable 3D mesh with adjustable lumbar support, 4D armrests, and 135-degree synchro-tilt recline."
  },
  {
    "id": 11,
    "name": "Scandinavian Solid Oak Minimalist Dining Table",
    "title": "Scandinavian Solid Oak Minimalist Dining Table",
    "price": 420.0,
    "stock": 8,
    "category": "Home and Furniture",
    "image": "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=600&auto=format&fit=crop&q=80",
    "description": "Sustainably sourced white oak dining table with matte protective lacquer and tapered legs."
  },
  {
    "id": 12,
    "name": "Modern Ceramic Artisan Warm Ambient Table Lamp",
    "title": "Modern Ceramic Artisan Warm Ambient Table Lamp",
    "price": 79.99,
    "stock": 35,
    "category": "Home and Furniture",
    "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
    "description": "Handcrafted textured ceramic base with linen drum shade and warm-glow LED dimmer bulb included."
  },
  {
    "id": 13,
    "name": "Organic Cold-Pressed Extra Virgin Olive Oil 1L",
    "title": "Organic Cold-Pressed Extra Virgin Olive Oil 1L",
    "price": 24.99,
    "stock": 80,
    "category": "Groceries and Pet Supplies",
    "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
    "description": "Single-origin cold-pressed olive oil rich in polyphenols and antioxidants from Mediterranean orchards."
  },
  {
    "id": 14,
    "name": "Artisan Roasted Arabica Whole Bean Coffee 1kg",
    "title": "Artisan Roasted Arabica Whole Bean Coffee 1kg",
    "price": 28.5,
    "stock": 65,
    "category": "Groceries and Pet Supplies",
    "image": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80",
    "description": "Single-origin Ethiopian Yirgacheffe medium roast with tasting notes of dark chocolate and citrus."
  },
  {
    "id": 15,
    "name": "Premium Grain-Free Wild Salmon Dog Nutrition 5kg",
    "title": "Premium Grain-Free Wild Salmon Dog Nutrition 5kg",
    "price": 48.0,
    "stock": 40,
    "category": "Groceries and Pet Supplies",
    "image": "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&auto=format&fit=crop&q=80",
    "description": "High-protein grain-free formula enriched with omega-3 fatty acids for canine joint and coat vitality."
  },
  {
    "id": 16,
    "name": "Designing Data-Intensive Applications Hardcover",
    "title": "Designing Data-Intensive Applications Hardcover",
    "price": 49.99,
    "stock": 45,
    "category": "Books and Education",
    "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    "description": "The definitive guide to distributed data systems, consistency models, and reliability engineering."
  },
  {
    "id": 17,
    "name": "Clean Code: Handbook of Agile Software Craftsmanship",
    "title": "Clean Code: Handbook of Agile Software Craftsmanship",
    "price": 42.5,
    "stock": 35,
    "category": "Books and Education",
    "image": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80",
    "description": "Learn best practices of writing clean, maintainable, and testable code from software engineering pioneers."
  },
  {
    "id": 18,
    "name": "Atomic Habits by James Clear Collectors Edition",
    "title": "Atomic Habits by James Clear Collectors Edition",
    "price": 26.99,
    "stock": 60,
    "category": "Books and Education",
    "image": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
    "description": "An easy and proven way to build good habits and break bad ones with actionable behavioral frameworks."
  },
  {
    "id": 19,
    "name": "PlayStation 5 Pro Console DualSense Bundle",
    "title": "PlayStation 5 Pro Console DualSense Bundle",
    "price": 699.99,
    "stock": 14,
    "category": "Games and Live Shopping",
    "image": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80",
    "description": "4K 120Hz ray-traced gaming console with ultra-fast 2TB SSD and haptic feedback wireless controller."
  },
  {
    "id": 20,
    "name": "Nintendo Switch OLED Model Neon Red & Blue",
    "title": "Nintendo Switch OLED Model Neon Red & Blue",
    "price": 349.99,
    "stock": 22,
    "category": "Games and Live Shopping",
    "image": "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600&auto=format&fit=crop&q=80",
    "description": "7-inch vivid OLED display, wide adjustable stand, enhanced audio, and 64GB internal storage."
  },
  {
    "id": 21,
    "name": "Xbox Wireless Controller Carbon Black with USB-C",
    "title": "Xbox Wireless Controller Carbon Black with USB-C",
    "price": 59.99,
    "stock": 40,
    "category": "Games and Live Shopping",
    "image": "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=600&auto=format&fit=crop&q=80",
    "description": "Textured grip on triggers, bumpers, and back-case with hybrid D-pad and Bluetooth cross-play support."
  },
  {
    "id": 22,
    "name": "Smart UV-C True HEPA Air Purifier 360",
    "title": "Smart UV-C True HEPA Air Purifier 360",
    "price": 149.0,
    "stock": 28,
    "category": "Pharmacy and Household",
    "image": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80",
    "description": "Medical-grade H13 HEPA filter capturing 99.97% of airborne allergens, pollen, dust, and VOC odors."
  },
  {
    "id": 23,
    "name": "Digital Infrared Non-Contact Medical Thermometer",
    "title": "Digital Infrared Non-Contact Medical Thermometer",
    "price": 34.99,
    "stock": 50,
    "category": "Pharmacy and Household",
    "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
    "description": "Instant 1-second temperature readout with color-coded fever warning display and 32 memory recalls."
  },
  {
    "id": 24,
    "name": "Comprehensive Emergency First Aid Kit 150-Piece",
    "title": "Comprehensive Emergency First Aid Kit 150-Piece",
    "price": 44.5,
    "stock": 65,
    "category": "Pharmacy and Household",
    "image": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=80",
    "description": "Hospital-grade bandages, antiseptic wipes, burn dressings, and trauma scissors in compact waterproof case."
  },
  {
    "id": 25,
    "name": "All-Weather Aviation Hardshell Carry-On Luggage",
    "title": "All-Weather Aviation Hardshell Carry-On Luggage",
    "price": 179.99,
    "stock": 25,
    "category": "Travel and Auto",
    "image": "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=600&auto=format&fit=crop&q=80",
    "description": "Polycarbonate spinner suitcase with TSA-approved combination locks and silent 360-degree wheels."
  },
  {
    "id": 26,
    "name": "Ultra 4K Dual Dash Cam with Night Vision & GPS",
    "title": "Ultra 4K Dual Dash Cam with Night Vision & GPS",
    "price": 129.0,
    "stock": 32,
    "category": "Travel and Auto",
    "image": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
    "description": "Front and rear dual recording with Sony Starvis sensor, 24-hour parking monitor, and WiFi phone sync."
  },
  {
    "id": 27,
    "name": "Waterproof Heavy-Duty Camping Backpack 50L",
    "title": "Waterproof Heavy-Duty Camping Backpack 50L",
    "price": 89.99,
    "stock": 38,
    "category": "Travel and Auto",
    "image": "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&auto=format&fit=crop&q=80",
    "description": "Ripstop nylon expedition pack with ergonomic weight-distribution harness and integrated rain cover."
  },
  {
    "id": 28,
    "name": "STEM Robotic Engineering Discovery Kit",
    "title": "STEM Robotic Engineering Discovery Kit",
    "price": 69.95,
    "stock": 42,
    "category": "Toys and Kids",
    "image": "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=600&auto=format&fit=crop&q=80",
    "description": "Programmable robotic building set with Bluetooth sensor modules and graphical block coding guide."
  },
  {
    "id": 29,
    "name": "Classic Natural Wooden Building Blocks Set 100pc",
    "title": "Classic Natural Wooden Building Blocks Set 100pc",
    "price": 39.5,
    "stock": 48,
    "category": "Toys and Kids",
    "image": "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&auto=format&fit=crop&q=80",
    "description": "Solid beechwood non-toxic geometric blocks encouraging spatial creativity and motor coordination."
  },
  {
    "id": 30,
    "name": "Plush Organic Cotton Cuddle Teddy Bear 40cm",
    "title": "Plush Organic Cotton Cuddle Teddy Bear 40cm",
    "price": 24.99,
    "stock": 55,
    "category": "Toys and Kids",
    "image": "https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=600&auto=format&fit=crop&q=80",
    "description": "Hypoallergenic soft organic cotton plush bear with embroidered details safe for all ages."
  },
  {
    "id": 31,
    "name": "Titanium GPS Multi-Sport Smart Fitness Watch",
    "title": "Titanium GPS Multi-Sport Smart Fitness Watch",
    "price": 329.0,
    "stock": 19,
    "category": "Sports and Fitness",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    "description": "Dual-frequency GPS, ECG monitor, sapphire crystal glass, and 100m water resistance for endurance training."
  },
  {
    "id": 32,
    "name": "Nike Air Zoom Pegasus Road Running Shoes",
    "title": "Nike Air Zoom Pegasus Road Running Shoes",
    "price": 130.0,
    "stock": 35,
    "category": "Sports and Fitness",
    "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    "description": "Responsive React foam midsole with dual Zoom Air units providing springy energy return on every stride."
  },
  {
    "id": 33,
    "name": "High-Density Non-Slip Eco Yoga Mat with Strap",
    "title": "High-Density Non-Slip Eco Yoga Mat with Strap",
    "price": 45.0,
    "stock": 50,
    "category": "Sports and Fitness",
    "image": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&auto=format&fit=crop&q=80",
    "description": "6mm premium TPE dual-layer mat offering superior cushioning, grip, and alignment guidance."
  },
  {
    "id": 34,
    "name": "Hydrating Hyaluronic Acid Botanical Serum 50ml",
    "title": "Hydrating Hyaluronic Acid Botanical Serum 50ml",
    "price": 38.5,
    "stock": 55,
    "category": "Beauty",
    "image": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
    "description": "Triple-weight molecular hyaluronic acid with antioxidant vitamin C and green tea extracts for deep hydration."
  },
  {
    "id": 35,
    "name": "Rose Damascena Refreshing Facial Toner Mist 150ml",
    "title": "Rose Damascena Refreshing Facial Toner Mist 150ml",
    "price": 26.0,
    "stock": 60,
    "category": "Beauty",
    "image": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
    "description": "Steam-distilled pure organic rosewater balancing skin pH and delivering revitalizing hydration."
  },
  {
    "id": 36,
    "name": "Luxury Satin Velvet Matte Lipstick Red Dahlia",
    "title": "Luxury Satin Velvet Matte Lipstick Red Dahlia",
    "price": 29.5,
    "stock": 45,
    "category": "Beauty",
    "image": "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80",
    "description": "Long-wear richly pigmented formula enriched with jojoba seed oil and shea butter for velvety lips."
  },
  {
    "id": 37,
    "name": "Luxury Artisanal Godiva Truffles Gift Box 36pc",
    "title": "Luxury Artisanal Godiva Truffles Gift Box 36pc",
    "price": 54.0,
    "stock": 40,
    "category": "Gifting",
    "image": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80",
    "description": "Assorted gourmet Belgian dark, milk, and white chocolate pralines presented in an embossed gold keepsake box."
  },
  {
    "id": 38,
    "name": "Scented Soy Wax Aromatherapy Candle Gift Set",
    "title": "Scented Soy Wax Aromatherapy Candle Gift Set",
    "price": 38.0,
    "stock": 50,
    "category": "Gifting",
    "image": "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80",
    "description": "Hand-poured pure soy wax infused with French lavender, vanilla bourbon, and cedar essential oils."
  },
  {
    "id": 39,
    "name": "Handmade Preserved Crimson Rose in Glass Dome",
    "title": "Handmade Preserved Crimson Rose in Glass Dome",
    "price": 65.0,
    "stock": 25,
    "category": "Gifting",
    "image": "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&auto=format&fit=crop&q=80",
    "description": "100% natural eternal rose preserved with organic resin, resting on solid wood base with LED fairy lights."
  },
  {
    "id": 40,
    "name": "Commercial Heavy-Duty Thermal Label Printer",
    "title": "Commercial Heavy-Duty Thermal Label Printer",
    "price": 189.99,
    "stock": 16,
    "category": "Business Purchases",
    "image": "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=80",
    "description": "High-speed 150mm/s direct thermal 4x6 shipping and barcode printer compatible with all fulfillment portals."
  },
  {
    "id": 41,
    "name": "Executive Italian Leather Briefcase & Organizer",
    "title": "Executive Italian Leather Briefcase & Organizer",
    "price": 220.0,
    "stock": 20,
    "category": "Business Purchases",
    "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    "description": "Full-grain leather with padded 16-inch laptop compartment, organizer pockets, and detachable shoulder strap."
  },
  {
    "id": 42,
    "name": "High-Speed Ultra 4K Conference Auto-Framing Cam",
    "title": "High-Speed Ultra 4K Conference Auto-Framing Cam",
    "price": 159.0,
    "stock": 24,
    "category": "Business Purchases",
    "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    "description": "Dual noise-canceling stereo mics, AI speaker tracking, and HDR video sensor for executive boardroom meetings."
  },
  {
    "id": 43,
    "name": "Bamboo Eco-Fiber Ultra Soft Bath Towel Set 4-Pack",
    "title": "Bamboo Eco-Fiber Ultra Soft Bath Towel Set 4-Pack",
    "price": 42.0,
    "stock": 45,
    "category": "Everyday Needs",
    "image": "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&auto=format&fit=crop&q=80",
    "description": "100% natural organic bamboo rayon towels offering unmatched softness, maximum absorbency, and quick drying."
  },
  {
    "id": 44,
    "name": "Double-Wall Insulated Stainless Steel Tumbler 750ml",
    "title": "Double-Wall Insulated Stainless Steel Tumbler 750ml",
    "price": 24.99,
    "stock": 70,
    "category": "Everyday Needs",
    "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    "description": "Food-grade 18/8 stainless steel flask keeping beverages ice cold for 24 hours or steaming hot for 12 hours."
  },
  {
    "id": 45,
    "name": "Natural Aloe & Lavender Hand Wash Refill Pouch 1L",
    "title": "Natural Aloe & Lavender Hand Wash Refill Pouch 1L",
    "price": 15.5,
    "stock": 85,
    "category": "Everyday Needs",
    "image": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80",
    "description": "Sulfate-free hydrating liquid soap formula enriched with vitamin E and soothing natural botanical extracts."
  },
  {
    "id": 46,
    "name": "Digital Smart Utility Meter & Fast Recharge Voucher",
    "title": "Digital Smart Utility Meter & Fast Recharge Voucher",
    "price": 50.0,
    "stock": 999,
    "category": "Bills and Recharges",
    "image": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    "description": "Instant prepaid electricity, fiber broadband, and smart utility auto-recharge credit token with zero fees."
  },
  {
    "id": 47,
    "name": "Ultra-Fast 5G Fiber Broadband Monthly Top-Up 300Mbps",
    "title": "Ultra-Fast 5G Fiber Broadband Monthly Top-Up 300Mbps",
    "price": 65.0,
    "stock": 999,
    "category": "Bills and Recharges",
    "image": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80",
    "description": "Unlimited high-speed gigabit fiber data allowance voucher with priority symmetrical upload bandwidth."
  },
  {
    "id": 48,
    "name": "Metro Transit & EV Smart Charging Mobility Pass",
    "title": "Metro Transit & EV Smart Charging Mobility Pass",
    "price": 40.0,
    "stock": 999,
    "category": "Bills and Recharges",
    "image": "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format&fit=crop&q=80",
    "image_url": "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format&fit=crop&q=80",
    "description": "Universal contactless transit pass and electric vehicle supercharging digital credit card voucher."
  }
]];

export function StoreProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("rmart_theme") || "dark");

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("rmart_user");
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed?.email && parsed.email.toLowerCase().includes("admin")) {
        parsed.is_admin = true;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rmart_cart")) || [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);

  // 2-SECOND AUTO-DISMISS POPUP
  const [activePopup, setActivePopup] = useState(null);

  const showPopup = (title, message, icon = "🔔") => {
    const popupData = { title, message, icon, id: Date.now() };
    setActivePopup(popupData);
    setTimeout(() => {
      setActivePopup((curr) => (curr?.id === popupData.id ? null : curr));
    }, 2000);
  };

  // OVERWRITE ANY STALE 4-ITEM INVENTORY
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem("rmart_inventory");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length >= 8) return parsed;
      }
    } catch {}
    localStorage.setItem("rmart_inventory", JSON.stringify(FULL_CATALOG));
    return FULL_CATALOG;
  });

  const [adminNotifications, setAdminNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rmart_admin_notifications")) || [];
    } catch {
      return [];
    }
  });

  const [userNotifications, setUserNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rmart_user_notifications")) || [];
    } catch {
      return [];
    }
  });

  const [restockRequests, setRestockRequests] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rmart_restock_requests")) || [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rmart_orders")) || [];
    } catch {
      return [];
    }
  });

  const [tickets, setTickets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rmart_tickets")) || [];
    } catch {
      return [];
    }
  });

  // Pull from backend and merge
  useEffect(() => {
    apiClient.get("/products")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const formatted = res.data.map((item) => ({
            id: item.id || `p-${Math.random()}`,
            title: item.title || item.name || "Product",
            price: parseFloat(item.price) || 0,
            category: item.category || "General",
            stock: item.stock !== undefined ? parseInt(item.stock, 10) : 10,
            image_url: item.image_url || "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
            description: item.description || "Verified store item."
          }));

          setInventory((prev) => {
            const combined = [...formatted];
            prev.forEach((p) => {
              if (!combined.some((b) => String(b.id) === String(p.id))) {
                combined.push(p);
              }
            });
            localStorage.setItem("rmart_inventory", JSON.stringify(combined));
            return combined;
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("rmart_theme", theme);
    document.body.style.backgroundColor = theme === "dark" ? "#06080F" : "#F8FAFC";
    document.body.style.color = theme === "dark" ? "#F8FAFC" : "#0F172A";
  }, [theme]);

  useEffect(() => {
    if (inventory.length > 0) localStorage.setItem("rmart_inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("rmart_restock_requests", JSON.stringify(restockRequests));
  }, [restockRequests]);

  useEffect(() => {
    localStorage.setItem("rmart_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("rmart_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("rmart_admin_notifications", JSON.stringify(adminNotifications));
  }, [adminNotifications]);

  useEffect(() => {
    localStorage.setItem("rmart_user_notifications", JSON.stringify(userNotifications));
  }, [userNotifications]);

  useEffect(() => {
    localStorage.setItem("rmart_tickets", JSON.stringify(tickets));
  }, [tickets]);

  const pushAdminNotification = (type, title, message) => {
    const notif = {
      id: `ADMN-${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      unread: true
    };
    setAdminNotifications((prev) => [notif, ...prev]);
    showPopup(title, message, "🛡️");
  };

  const pushUserNotification = (type, title, message) => {
    const notif = {
      id: `USER-${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      unread: true
    };
    setUserNotifications((prev) => [notif, ...prev]);
    showPopup(title, message, "🛒");
  };

  const markAdminNotificationsRead = () => {
    setAdminNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markUserNotificationsRead = () => {
    setUserNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const login = (userData) => {
    if (userData?.email && userData.email.toLowerCase().includes("admin")) {
      userData.is_admin = true;
    }
    setUser(userData);
    localStorage.setItem("rmart_user", JSON.stringify(userData));
    showPopup("Logged In", `Welcome back, ${userData.name}!`, "👋");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("rmart_user");
    localStorage.removeItem("token");
    showPopup("Signed Out", "You have signed out of R-Mart.", "🔒");
  };

  const addProduct = async (newProd) => {
    setInventory((prev) => [newProd, ...prev]);
    pushAdminNotification("catalog", "📦 Product Published", `"${newProd.title}" is now live with ${newProd.stock} units.`);
    try {
      await apiClient.post("/products", newProd);
    } catch {}
  };

  const deleteProduct = async (id) => {
    const target = inventory.find((p) => String(p.id) === String(id));
    setInventory((prev) => prev.filter((item) => String(item.id) !== String(id)));
    pushAdminNotification("catalog", "🗑️ Product Deleted", `"${target?.title || id}" was permanently removed.`);
    try {
      await apiClient.delete(`/products/${id}`);
    } catch {}
  };

  const updateProductStock = (id, newStock) => {
    const stockVal = Math.max(0, parseInt(newStock, 10));
    setInventory((prev) =>
      prev.map((item) => {
        if (String(item.id) === String(id)) {
          if (stockVal < 5) {
            pushAdminNotification(
              "stockout",
              stockVal === 0 ? "🔴 CRITICAL: Out of Stock!" : "⚠️ Low Stock Alert",
              `"${item.title}" has ${stockVal === 0 ? "0 units left" : `only ${stockVal} units left`}.`
            );
          } else {
            showPopup("Stock Updated", `Stock for "${item.title}" updated to ${stockVal}.`, "📦");
          }
          return { ...item, stock: stockVal };
        }
        return item;
      })
    );
  };

  const requestProductRestock = (product) => {
    const userEmail = user?.email || "customer@rmart.com";
    setRestockRequests((prev) => {
      const existing = prev.find((r) => String(r.productId) === String(product.id));
      if (existing) {
        return prev.map((r) =>
          String(r.productId) === String(product.id) ? { ...r, count: r.count + 1, timestamp: "Just now" } : r
        );
      }
      return [
        {
          id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
          productId: product.id,
          productTitle: product.title || product.name,
          requestedBy: userEmail,
          timestamp: "Just now",
          count: 1
        },
        ...prev
      ];
    });

    pushAdminNotification("demand", "🔔 Restock Demand", `Customer requested "${product.title || product.name}".`);
    pushUserNotification("restock_demand", "🔔 Request Sent", `We'll notify you as soon as "${product.title || product.name}" is back!`);
  };

  const sendApologyRestockNotice = (requestId, productTitle, userEmail) => {
    const apologyMessage = `Kindly apologise, "${productTitle}" is currently out of stock. It will be restocked and available in your hub within 24-48 hours. Thank you for your patience!`;
    pushUserNotification("restock_eta", `Warehouse ETA: ${productTitle}`, apologyMessage);
    pushAdminNotification("apology_sent", "📩 Apology Notice Sent", `24-48h ETA notice dispatched to ${userEmail}.`);

    setRestockRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, adminNotified: true, lastResponse: apologyMessage } : r))
    );
  };

  const addToCart = (product) => {
    if (!product) return;
    const maxStock = Number(product.stock || 0);
    if (maxStock <= 0) {
      showPopup("Out of Stock", `"${product.title || product.name}" is sold out!`, "⚠️");
      return;
    }

    const cleanId = product.id ?? product._id ?? `p-${Math.random().toString(36).substr(2, 6)}`;
    const cleanPrice = parseFloat(product.price) || 0;
    const cleanTitle = product.title || product.name || "R-Mart Item";
    const cleanImg = product.image_url || "";

    setCart((prevCart) => {
      const idx = prevCart.findIndex((item) => String(item.id) === String(cleanId));
      if (idx > -1) {
        const currentQty = prevCart[idx].quantity;
        if (currentQty >= maxStock) {
          showPopup("Stock Limit", `Cannot add more! Only ${maxStock} in stock.`, "⚠️");
          return prevCart;
        }
        const copy = [...prevCart];
        copy[idx].quantity += 1;
        return copy;
      }
      return [
        ...prevCart,
        {
          id: cleanId,
          title: cleanTitle,
          name: cleanTitle,
          price: cleanPrice,
          image_url: cleanImg,
          quantity: 1,
          maxStock: maxStock
        },
      ];
    });

    showPopup("Added to Cart", `"${cleanTitle}" added!`, "✓");

    setTimeout(() => {
      pushUserNotification(
        "cart_waiting",
        "🛒 Hey! I'm waiting in your cart...",
        `"${cleanTitle}" is waiting for you! Bring me home before stock runs out!`
      );
    }, 6000);
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (String(item.id) === String(id)) {
            const product = inventory.find((p) => String(p.id) === String(id));
            const availableStock = product ? Number(product.stock) : (item.maxStock || 99);
            const next = item.quantity + delta;
            if (next > availableStock) {
              showPopup("Stock Limit", `Only ${availableStock} units available.`, "⚠️");
              return item;
            }
            return next > 0 ? { ...item, quantity: next } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const placeOrder = (shippingAddress, paymentDetails) => {
    if (cart.length === 0) return null;

    const celeryTaskId = `celery-job-${Math.random().toString(36).substr(2, 8)}`;
    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      celery_task_id: celeryTaskId,
      customer: user?.name || "Customer",
      email: user?.email || "customer@rmart.com",
      items: [...cart],
      total: cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0),
      status: "Processing (Queued in Redis)",
      address: shippingAddress || user?.address || "Primary Store Location, AP",
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      redis_queue: "default_orders",
      payment: paymentDetails || {
        method: "UPI",
        transactionId: `TXN-${Date.now().toString().slice(-8)}`,
        status: "Captured & Paid",
        accountRef: "Verified Account"
      }
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setIsCartOpen(false);
    setLastPlacedOrder(newOrder);

    newOrder.items.forEach((item) => {
      const prod = inventory.find((i) => String(i.id) === String(item.id));
      const remaining = (prod?.stock || item.quantity) - item.quantity;
      updateProductStock(item.id, remaining);
    });

    pushUserNotification(
      "order_placed",
      `🎉 Order #${newOrder.id} Placed!`,
      `Payment of $${newOrder.total.toFixed(2)} confirmed. Dispatched to Celery worker.`
    );

    pushAdminNotification(
      "new_order",
      `📦 New Order #${newOrder.id}!`,
      `Customer ${newOrder.customer} placed an order for $${newOrder.total.toFixed(2)}.`
    );

    return newOrder;
  };

  const modifyOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          let notifTitle = `Order #${o.id} Updated`;
          let notifMsg = `Your order status is now: ${newStatus}`;

          if (newStatus.includes("Dispatched")) {
            notifTitle = `🚚 Order #${o.id} Dispatched!`;
            notifMsg = `Your package has left the hub and is moving along the express corridor.`;
          } else if (newStatus.includes("Delivery")) {
            notifTitle = `🛵 Order #${o.id} Out for Delivery!`;
            notifMsg = `Our courier is arriving at your destination!`;
          } else if (newStatus.includes("Delivered")) {
            notifTitle = `✅ Order #${o.id} Delivered!`;
            notifMsg = `Package delivered successfully. Thank you for choosing R-Mart!`;
          } else if (newStatus.includes("Cancelled")) {
            notifTitle = `❌ Order #${o.id} Cancelled`;
            notifMsg = `Your order #${o.id} was cancelled. Refund processed.`;
          }

          pushUserNotification("order_status", notifTitle, notifMsg);
          pushAdminNotification("order_modified", `Order #${o.id} Modified`, `Status changed to "${newStatus}".`);
          return { ...o, status: newStatus };
        }
        return o;
      })
    );
  };

  const addTicket = (subject, message) => {
    const userEmail = user?.email || "customer@rmart.com";
    const newTck = {
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      user: userEmail,
      subject,
      message,
      status: "Open",
      priority: "High",
      date: new Date().toISOString().substring(0, 10),
    };
    setTickets((prev) => [newTck, ...prev]);

    pushUserNotification("ticket_opened", `📋 Complaint Registered (#${newTck.id})`, `Subject: "${subject}". Support desk is on it.`);
    pushAdminNotification("complaint", `🚨 New Complaint (#${newTck.id})`, `Shopper ${userEmail}: "${subject}".`);
    return newTck;
  };

  const resolveTicket = (ticketId, replyMessage) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const finalReply = replyMessage || "Admin resolved your issue.";
          pushUserNotification("ticket_resolved", `✅ Complaint #${t.id} Resolved`, `Admin: "${finalReply}"`);
          pushAdminNotification("ticket_closed", `Complaint #${t.id} Closed`, `Resolved for ${t.user}.`);
          return { ...t, status: "Resolved", reply: finalReply };
        }
        return t;
      })
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        theme,
        toggleTheme,
        user,
        login,
        logout,
        inventory,
        addProduct,
        deleteProduct,
        updateProductStock,
        restockRequests,
        requestProductRestock,
        sendApologyRestockNotice,
        cart,
        addToCart,
        updateQuantity,
        placeOrder,
        lastPlacedOrder,
        setLastPlacedOrder,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        orders,
        modifyOrderStatus,
        adminNotifications,
        userNotifications,
        markAdminNotificationsRead,
        markUserNotificationsRead,
        tickets,
        addTicket,
        resolveTicket,
        showPopup
      }}
    >
      {children}

      {/* FLOATING POPUP TOAST (DISAPPEARS STRICTLY IN 2 SECONDS) */}
      {activePopup && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "24px",
          backgroundColor: "#0F172A",
          color: "#FFFFFF",
          border: "2px solid #F59E0B",
          borderRadius: "12px",
          padding: "14px 18px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.85), 0 0 15px rgba(245,158,11,0.3)",
          zIndex: 999999,
          maxWidth: "360px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          animation: "slideInRight 0.25s ease-out",
          fontFamily: "system-ui, sans-serif"
        }}>
          <span style={{ fontSize: "22px", lineHeight: "1" }}>{activePopup.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "900", fontSize: "13px", color: "#F59E0B", marginBottom: "2px" }}>
              {activePopup.title}
            </div>
            <div style={{ fontSize: "12px", color: "#E2E8F0", lineHeight: "1.3" }}>
              {activePopup.message}
            </div>
            <div style={{ fontSize: "9px", color: "#94A3B8", marginTop: "4px" }}>
              auto-dismissing in 2s...
            </div>
          </div>
        </div>
      )}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
