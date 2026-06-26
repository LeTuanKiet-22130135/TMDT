"""VNPay payment service — sandbox integration.

Builds VNPay payment URLs and verifies secure-hash signatures
using HMAC-SHA512 (VNPay API v2.1 spec).
"""

import hashlib
import hmac
import urllib.parse
from datetime import datetime, timezone, timedelta

from app.core.config import settings


# VNPay API version
VNPAY_VERSION = "2.1.0"
VNPAY_COMMAND = "pay"
VNPAY_CURRENCY = "VND"
VNPAY_LOCALE = "vn"
VNPAY_ORDER_TYPE = "other"

# Vietnam timezone (UTC+7)
_VN_TZ = timezone(timedelta(hours=7))


def _hmac_sha512(key: str, data: str) -> str:
    """Generate HMAC-SHA512 hex digest."""
    return hmac.new(key.encode("utf-8"), data.encode("utf-8"), hashlib.sha512).hexdigest()


def create_payment_url(
    order_id: str,
    amount: int,
    order_info: str,
    ip_addr: str,
) -> str:
    """Build a VNPay sandbox payment URL.

    Args:
        order_id: Unique transaction reference (vnp_TxnRef). Must be unique per payment attempt.
        amount: Payment amount in VND (will be multiplied by 100 per VNPay spec).
        order_info: Description shown on VNPay payment page.
        ip_addr: Customer IP address.

    Returns:
        Full redirect URL to VNPay sandbox.
    """
    now = datetime.now(_VN_TZ)

    params: dict[str, str] = {
        "vnp_Version": VNPAY_VERSION,
        "vnp_Command": VNPAY_COMMAND,
        "vnp_TmnCode": settings.vnpay_tmn_code,
        "vnp_Amount": str(amount * 100),
        "vnp_CurrCode": VNPAY_CURRENCY,
        "vnp_TxnRef": order_id,
        "vnp_OrderInfo": order_info,
        "vnp_OrderType": VNPAY_ORDER_TYPE,
        "vnp_Locale": VNPAY_LOCALE,
        "vnp_ReturnUrl": settings.vnpay_return_url,
        "vnp_IpAddr": ip_addr,
        "vnp_CreateDate": now.strftime("%Y%m%d%H%M%S"),
        "vnp_ExpireDate": (now + timedelta(minutes=15)).strftime("%Y%m%d%H%M%S"),
    }

    # Sort params alphabetically and build query string (VNPay requirement)
    sorted_params = sorted(params.items())
    query_string = urllib.parse.urlencode(sorted_params, quote_via=urllib.parse.quote_plus)

    # Generate secure hash
    secure_hash = _hmac_sha512(settings.vnpay_hash_secret, query_string)
    payment_url = f"{settings.vnpay_url}?{query_string}&vnp_SecureHash={secure_hash}"

    return payment_url


def verify_return_params(params: dict[str, str]) -> dict:
    """Verify VNPay return/IPN query parameters.

    Validates the vnp_SecureHash against the remaining params.

    Args:
        params: Query parameters from VNPay callback (return URL or IPN).

    Returns:
        dict with keys:
            - is_valid: bool — signature verification result
            - response_code: str — vnp_ResponseCode (e.g. "00" = success)
            - transaction_id: str — vnp_TxnRef
            - vnpay_transaction_no: str — vnp_TransactionNo
            - amount: int — actual amount in VND
            - order_info: str — vnp_OrderInfo
    """
    # Extract and remove hash fields
    input_params = dict(params)
    received_hash = input_params.pop("vnp_SecureHash", "")
    input_params.pop("vnp_SecureHashType", None)

    # Rebuild query string from sorted remaining params
    sorted_params = sorted(input_params.items())
    query_string = urllib.parse.urlencode(sorted_params, quote_via=urllib.parse.quote_plus)

    # Compute expected hash
    expected_hash = _hmac_sha512(settings.vnpay_hash_secret, query_string)

    is_valid = hmac.compare_digest(expected_hash.lower(), received_hash.lower())

    return {
        "is_valid": is_valid,
        "response_code": params.get("vnp_ResponseCode", ""),
        "transaction_id": params.get("vnp_TxnRef", ""),
        "vnpay_transaction_no": params.get("vnp_TransactionNo", ""),
        "amount": int(params.get("vnp_Amount", "0")) // 100,
        "order_info": params.get("vnp_OrderInfo", ""),
    }
