import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.entities import Wallet, WalletTransaction, WalletTransactionStatusEnum, WalletTransactionTypeEnum, PaymentMethodEnum, PaymentStatusEnum, OrderStatusEnum

def test_wallet_topup_and_ipn(client: TestClient, db_session: Session, sample_data: dict):
    # Setup - authenticate as buyer
    buyer = sample_data["buyer"]
    client.headers.update({"Authorization": f"Bearer token-{buyer.id}"}) # mock auth if needed, wait, auth requires token.
    # We will override get_current_user to return buyer for this test
    from app.api.dependencies import get_current_user
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: buyer

    # Test topup endpoint
    payload = {"amount": 50000}
    response = client.post("/api/v1/wallet/topup", json=payload)
    assert response.status_code == 200, response.json()
    assert "payment_url" in response.json()
    
    # Get the created wallet transaction
    wallet = db_session.query(Wallet).filter(Wallet.user_id == buyer.id).first()
    assert wallet is not None
    assert float(wallet.balance) == 0.0

    txn = db_session.query(WalletTransaction).filter(WalletTransaction.wallet_id == wallet.id).first()
    assert txn is not None
    assert txn.status == WalletTransactionStatusEnum.PENDING
    assert float(txn.amount) == 50000.0
    
    # Simulate IPN callback
    txn_id = str(txn.id)
    simulate_url = f"/api/v1/wallet/simulate-ipn/{txn_id}"
    res = client.post(simulate_url)
    assert res.status_code == 200, res.json()
    assert res.json()["success"] is True

    # Verify wallet balance updated
    db_session.refresh(wallet)
    assert float(wallet.balance) == 50000.0

    db_session.refresh(txn)
    assert txn.status == WalletTransactionStatusEnum.SUCCESS

    app.dependency_overrides.pop(get_current_user, None)


def test_digital_checkout_wallet(client: TestClient, db_session: Session, sample_data: dict):
    buyer = sample_data["buyer"]
    product = sample_data["product"]
    
    # Provide wallet balance
    wallet = Wallet(user_id=buyer.id, balance=2000)
    db_session.add(wallet)
    db_session.commit()
    
    from app.api.dependencies import get_current_user
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: buyer

    payload = {
        "product_ids": [str(product.id)],
        "return_url": "http://localhost/return",
        "payment_method": "WALLET"
    }

    response = client.post("/api/v1/checkout-digital/", json=payload)
    assert response.status_code == 200, response.json()
    res_data = response.json()
    
    assert res_data["total"] == 1000
    assert "wallet=1" in res_data["payment_url"]
    
    # Verify wallet deduction
    db_session.refresh(wallet)
    assert float(wallet.balance) == 1000.0
    
    app.dependency_overrides.pop(get_current_user, None)
