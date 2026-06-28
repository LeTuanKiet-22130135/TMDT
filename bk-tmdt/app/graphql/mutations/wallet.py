from decimal import Decimal
import json

import strawberry
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.dependencies import get_db
from strawberry.types import Info
from app.graphql.types import WalletTransactionType, to_wallet_transaction_type
from app.models.entities import Wallet, WalletTransaction, WalletTransactionTypeEnum, WalletTransactionStatusEnum


@strawberry.type
class WalletMutation:
    @strawberry.mutation
    def request_withdrawal(
        self,
        info: Info,
        amount: float,
        bank_details: str,
    ) -> WalletTransactionType:
        user = info.context.get("current_user")
        if not user:
            raise Exception("Unauthorized")
        
        if amount < 50000:
            raise Exception("Minimum withdrawal amount is 50,000")

        db: Session = info.context.get("db")

        wallet = db.query(Wallet).filter(Wallet.user_id == user.id).with_for_update().first()
        if not wallet:
            raise Exception("Wallet not found")

        if wallet.balance < Decimal(str(amount)):
            raise Exception("Insufficient balance")

        # Deduct balance immediately
        balance_before = wallet.balance
        wallet.balance -= Decimal(str(amount))
        balance_after = wallet.balance

        # Create pending withdrawal transaction
        transaction = WalletTransaction(
            wallet_id=wallet.id,
            transaction_type=WalletTransactionTypeEnum.WITHDRAWAL,
            amount=Decimal(str(amount)),
            balance_before=balance_before,
            balance_after=balance_after,
            status=WalletTransactionStatusEnum.PENDING,
            reference_id=bank_details,
        )

        db.add(wallet)
        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        return to_wallet_transaction_type(transaction)
