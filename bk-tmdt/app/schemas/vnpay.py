from uuid import UUID

from app.schemas.base import ORMModel


class VNPayCreateResponse(ORMModel):
    """Response when creating a VNPay payment URL."""
    payment_url: str


class VNPayReturnResponse(ORMModel):
    """Response after VNPay return redirect verification."""
    success: bool
    message: str
    order_id: UUID | None = None
    transaction_id: str | None = None
    response_code: str | None = None


class VNPayIPNResponse(ORMModel):
    """Standard IPN response expected by VNPay."""
    RspCode: str
    Message: str


class VNPaySimulateResponse(ORMModel):
    """Response from the IPN simulation endpoint."""
    success: bool
    message: str
    order_id: UUID
    payment_status: str
    order_status: str
