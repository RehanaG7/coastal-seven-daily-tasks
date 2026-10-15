"""
Day 21 - Autonomous AI Agent Engine with Function / Tool Calling
Coordinates tool invocation, step-by-step reasoning traces,
and integrates live tool execution results into grounded conversational answers.
"""

import json
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from core.tools import (
    TOOL_DEFINITIONS,
    tool_check_product_stock,
    tool_track_order_shipment,
    tool_validate_store_coupon,
    tool_create_support_ticket
)


class AIAgentEngine:
    """
    Autonomous agent engine that detects needed tools, invokes them securely,
    and constructs a comprehensive grounded response.
    """

    def __init__(self):
        self.tools = TOOL_DEFINITIONS

    def detect_and_parse_tool(self, message: str) -> Optional[Dict[str, Any]]:
        """
        Analyzes customer query to extract tool invocation and parameters.
        Supports both natural language patterns and structured tool commands.
        """
        msg_clean = message.strip()
        msg_lower = msg_clean.lower()

        # 1. Coupon validation intent
        # e.g., "validate coupon FLASH50", "is coupon FREESHIP valid?", "check coupon SPARK20"
        coupon_match = re.search(r"\b(?:coupon|promo\s*code|voucher|discount\s*code)\s*[:=]?\s*([A-Za-z0-9_-]+)\b", msg_lower)
        if not coupon_match:
            # Check standalone coupon names
            for code in ["flash50", "freeship", "welcome10", "spark20"]:
                if code in msg_lower:
                    coupon_match = re.search(rf"\b({code})\b", msg_lower)
                    break

        if coupon_match and any(w in msg_lower for w in ["coupon", "promo", "discount", "code", "valid"]):
            code = coupon_match.group(1).upper()
            return {
                "tool": "validate_store_coupon",
                "parameters": {"coupon_code": code}
            }

        # 2. Track order shipment intent
        # e.g., "track order #12", "where is my order 5", "order status 3"
        order_match = re.search(r"(?:order|tracking)\s*(?:#|no\.?|id|number)?\s*(\d+)", msg_lower)
        if order_match and any(w in msg_lower for w in ["track", "order", "status", "shipment", "where is", "delivery"]):
            order_id = int(order_match.group(1))
            return {
                "tool": "track_order_shipment",
                "parameters": {"order_id": order_id}
            }

        # 3. Create support ticket intent
        # e.g., "create ticket: damaged item", "file a complaint about my broken screen", "open support ticket"
        if any(w in msg_lower for w in ["create ticket", "file ticket", "open ticket", "support ticket", "escalate to admin", "raise a ticket"]):
            subject = msg_clean[:60]
            for prefix in ["create ticket:", "file ticket:", "support ticket:"]:
                if prefix in msg_lower:
                    idx = msg_lower.index(prefix) + len(prefix)
                    subject = msg_clean[idx:].strip()
            return {
                "tool": "create_support_ticket",
                "parameters": {
                    "subject": subject or "Customer Support Inquiry",
                    "details": msg_clean,
                    "priority": "high" if any(w in msg_lower for w in ["urgent", "broken", "damaged", "scam", "immediately"]) else "medium"
                }
            }

        # 4. Check product stock intent
        # e.g., "is iphone in stock?", "how many sony headphones available?", "check stock for 2"
        if any(w in msg_lower for w in ["stock", "available", "units left", "how many", "inventory", "price of"]):
            # Extract product title or id
            clean_subject = re.sub(r"\b(?:check|what is|how many|is|are|the|stock|for|in|available|units|price|of)\b|[?]", " ", msg_lower)
            clean_subject = re.sub(r"\s+", " ", clean_subject).strip()
            if clean_subject:
                return {
                    "tool": "check_product_stock",
                    "parameters": {"product_identifier": clean_subject}
                }

        return None

    def execute_tool(self, tool_name: str, parameters: Dict[str, Any], db: Session, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Executes registered tool against live application state.
        """
        if tool_name == "check_product_stock":
            ident = parameters.get("product_identifier", "")
            return tool_check_product_stock(db, ident)

        elif tool_name == "track_order_shipment":
            order_id = parameters.get("order_id", 0)
            return tool_track_order_shipment(db, int(order_id))

        elif tool_name == "validate_store_coupon":
            code = parameters.get("coupon_code", "")
            return tool_validate_store_coupon(code)

        elif tool_name == "create_support_ticket":
            subject = parameters.get("subject", "Customer Inquiry")
            details = parameters.get("details", "")
            priority = parameters.get("priority", "medium")
            return tool_create_support_ticket(db, subject, details, user_id=user_id, priority=priority)

        return {"error": f"Unknown tool: {tool_name}"}

    def run(
        self,
        message: str,
        db: Session,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Executes end-to-end agent reasoning loop:
        1. Parse intent / tool need
        2. Execute tool
        3. Formulate conversational response
        4. Return execution trace
        """
        trace: List[Dict[str, Any]] = []
        trace.append({
            "step": "thought",
            "content": f"Analyzing user query: '{message}'"
        })

        tool_call = self.detect_and_parse_tool(message)

        if tool_call:
            tool_name = tool_call["tool"]
            params = tool_call["parameters"]
            trace.append({
                "step": "tool_call",
                "tool": tool_name,
                "parameters": params
            })

            tool_result = self.execute_tool(tool_name, params, db=db, user_id=user_id)
            trace.append({
                "step": "tool_result",
                "tool": tool_name,
                "data": tool_result
            })

            # Construct conversational grounded answer
            if tool_name == "check_product_stock":
                if tool_result.get("found"):
                    answer = (
                        f"⚡ Stock Update: {tool_result['message']}\n"
                        f"Would you like to add it to your cart or check out similar items?"
                    )
                else:
                    answer = f"I checked our inventory: {tool_result['message']}"

            elif tool_name == "track_order_shipment":
                if tool_result.get("found"):
                    answer = (
                        f"📦 Shipment Status: {tool_result['message']}\n"
                        f"Total Amount: ${tool_result['total_amount']:.2f} ({tool_result['items_count']} items)."
                    )
                else:
                    answer = f"Tracking lookup: {tool_result['message']}"

            elif tool_name == "validate_store_coupon":
                if tool_result.get("valid"):
                    answer = (
                        f"🎉 Coupon Valid: {tool_result['message']}\n"
                        f"Applies {tool_result['discount_value']}% discount on qualifying orders!"
                    )
                else:
                    answer = f"Coupon Status: {tool_result['message']}"

            elif tool_name == "create_support_ticket":
                answer = (
                    f"🎫 Support Ticket Created: {tool_result['message']}\n"
                    f"Our administrative team has received this and will review it immediately."
                )
            else:
                answer = "Tool execution completed."

            return {
                "has_tool_call": True,
                "tool_name": tool_name,
                "tool_result": tool_result,
                "answer": answer,
                "trace": trace
            }

        else:
            trace.append({
                "step": "thought",
                "content": "No external tool required; formulating direct assistant answer."
            })
            return {
                "has_tool_call": False,
                "tool_name": None,
                "tool_result": None,
                "answer": f"I understand! How can I assist you with products, orders, or store coupons today?",
                "trace": trace
            }


ai_agent = AIAgentEngine()
