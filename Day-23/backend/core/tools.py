"""
Day 21 - AI Agent Tool Registry
Defines deterministic, typed tools that AI Agents can invoke
to interact with application databases, order tracking, coupon validation,
and customer support dispatch.
"""

from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from models.user import User
from models.product import Product
from models.order import Order, OrderItem
from models.ecommerce import SupportTicket, Notification


# Active promotional coupon rules
ACTIVE_COUPONS = {
    "FLASH50": {
        "valid": True,
        "discount_type": "percentage",
        "discount_value": 50.0,
        "min_order": 100.0,
        "description": "50% Flash Sale discount on orders above $100."
    },
    "FREESHIP": {
        "valid": True,
        "discount_type": "shipping",
        "discount_value": 100.0,
        "min_order": 0.0,
        "description": "100% Free Express Shipping on your entire cart."
    },
    "WELCOME10": {
        "valid": True,
        "discount_type": "percentage",
        "discount_value": 10.0,
        "min_order": 25.0,
        "description": "10% Welcome gift for new R-Mart shoppers."
    },
    "SPARK20": {
        "valid": True,
        "discount_type": "percentage",
        "discount_value": 20.0,
        "min_order": 50.0,
        "description": "20% Sparky Special discount on electronics & gadgets."
    }
}


def tool_check_product_stock(db: Session, product_identifier: str) -> Dict[str, Any]:
    """
    Looks up real-time product stock, price, and availability in the catalog.
    """
    ident = str(product_identifier).strip()
    product = None

    if ident.isdigit():
        product = db.query(Product).filter(Product.id == int(ident)).first()

    ident_lower = ident.lower().strip()

    if not product:
        from sqlalchemy import func
        product = db.query(Product).filter(func.lower(Product.name).contains(ident_lower)).first()

    if not product:
        from sqlalchemy import func
        import re
        tokens = [t for t in re.findall(r"\w+", ident_lower) if len(t) >= 4 and t not in ["with", "pack", "unit", "item"]]
        for tok in tokens:
            candidate = db.query(Product).filter(func.lower(Product.name).contains(tok)).first()
            if candidate:
                product = candidate
                break

    if not product:
        return {
            "found": False,
            "query": ident,
            "message": f"No product found matching '{ident}' in our live catalog."
        }

    status = "In Stock" if product.stock > 5 else ("Low Stock" if product.stock > 0 else "Out of Stock")
    return {
        "found": True,
        "product_id": product.id,
        "name": product.name,
        "price": float(product.price),
        "stock": product.stock,
        "category": getattr(product, "category", "General"),
        "availability_status": status,
        "message": f"'{product.name}' is currently {status} with {product.stock} units available at ${product.price:.2f}."
    }


def tool_track_order_shipment(db: Session, order_id: int) -> Dict[str, Any]:
    """
    Retrieves fulfillment status, shipment tracking, and estimated delivery for an order.
    """
    order = db.query(Order).filter(Order.id == int(order_id)).first()
    if not order:
        return {
            "found": False,
            "order_id": order_id,
            "message": f"Order #{order_id} could not be found in our records."
        }

    items_count = len(order.items) if hasattr(order, "items") else 0
    status = (order.status or "Processing").title()

    estimates = {
        "Processing": "Estimated dispatch within 24 hours.",
        "Shipped": "In transit with delivery partner. Arriving in 2-3 business days.",
        "Delivered": "Delivered to shipping destination.",
        "Cancelled": "Order has been cancelled."
    }
    est_delivery = estimates.get(status, "Under active fulfillment.")

    return {
        "found": True,
        "order_id": order.id,
        "status": status,
        "total_amount": float(order.total_amount) if order.total_amount else 0.0,
        "items_count": items_count,
        "estimated_delivery": est_delivery,
        "created_at": str(order.created_at) if hasattr(order, "created_at") else None,
        "message": f"Order #{order.id} is {status}. {est_delivery}"
    }


def tool_validate_store_coupon(coupon_code: str) -> Dict[str, Any]:
    """
    Validates store promo coupons and calculates applied discount.
    """
    code_clean = (coupon_code or "").strip().upper()
    rule = ACTIVE_COUPONS.get(code_clean)
    if not rule:
        return {
            "valid": False,
            "code": code_clean,
            "message": f"Coupon code '{code_clean}' is invalid or expired. Try using FLASH50 or FREESHIP!"
        }

    return {
        "valid": True,
        "code": code_clean,
        "discount_type": rule["discount_type"],
        "discount_value": rule["discount_value"],
        "min_order": rule["min_order"],
        "description": rule["description"],
        "message": f"Success! Coupon {code_clean} applied: {rule['description']}"
    }


def tool_create_support_ticket(
    db: Session,
    subject: str,
    details: str,
    user_id: Optional[int] = None,
    priority: str = "medium"
) -> Dict[str, Any]:
    """
    Creates an expedited customer support ticket and alerts administrators.
    """
    ticket = SupportTicket(
        user_id=user_id or 1,
        subject=subject[:120],
        message=details,
        priority=priority if priority in ["low", "medium", "high"] else "medium",
        status="open"
    )
    db.add(ticket)
    db.flush()

    # Create admin notification
    notif = Notification(
        user_id=None,  # Broadcast to admins
        title=f"New AI Support Ticket #{ticket.id}",
        message=f"Urgent issue reported by shopper: {subject}",
        category="support"
    )
    db.add(notif)
    db.commit()
    db.refresh(ticket)

    return {
        "success": True,
        "ticket_id": ticket.id,
        "status": ticket.status,
        "priority": ticket.priority,
        "subject": ticket.subject,
        "message": f"Support ticket #{ticket.id} ('{ticket.subject}') has been registered and escalated to the Store Admin."
    }


# Standard JSON Schemas for AI Tool Calling
TOOL_DEFINITIONS = [
    {
        "name": "check_product_stock",
        "description": "Check the live inventory stock and price of a product by name or ID in the R-Mart catalog.",
        "parameters": {
            "type": "object",
            "properties": {
                "product_identifier": {
                    "type": "string",
                    "description": "The product name or ID to look up (e.g., 'Sony WH-1000XM5' or '1')"
                }
            },
            "required": ["product_identifier"]
        }
    },
    {
        "name": "track_order_shipment",
        "description": "Look up an order's fulfillment and tracking status using its order ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "integer",
                    "description": "The numerical ID of the order to track (e.g., 101)"
                }
            },
            "required": ["order_id"]
        }
    },
    {
        "name": "validate_store_coupon",
        "description": "Check whether a promotional discount code is valid and retrieve its savings value.",
        "parameters": {
            "type": "object",
            "properties": {
                "coupon_code": {
                    "type": "string",
                    "description": "The promotional code (e.g., 'FLASH50', 'FREESHIP')"
                }
            },
            "required": ["coupon_code"]
        }
    },
    {
        "name": "create_support_ticket",
        "description": "File and register an escalated customer support ticket directly with the Store Admin.",
        "parameters": {
            "type": "object",
            "properties": {
                "subject": {
                    "type": "string",
                    "description": "Brief summary of the issue (e.g., 'Damaged item received')"
                },
                "details": {
                    "type": "string",
                    "description": "Detailed explanation of the issue"
                },
                "priority": {
                    "type": "string",
                    "enum": ["low", "medium", "high"],
                    "description": "Urgency level"
                }
            },
            "required": ["subject", "details"]
        }
    }
]
