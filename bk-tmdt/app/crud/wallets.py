from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.entities import Wallet, WalletTransaction, WalletTransactionTypeEnum, WalletTransactionStatusEnum, WalletStatusEnum, Order, Store

def ensure_wallet_exists(db: Session, user_id) -> Wallet:
    """Ensure a user has a wallet, creating one if necessary."""
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).with_for_update().first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance=Decimal("0.00"), status=WalletStatusEnum.ACTIVE)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
        
        # We need to lock it again after creation to prevent race conditions during updates
        wallet = db.query(Wallet).filter(Wallet.user_id == user_id).with_for_update().first()
    return wallet

def payout_to_store_owner(db: Session, order: Order):
    """Transfer the order amount to the store owner's wallet."""
    # Find the store owner
    store = db.get(Store, order.store_id)
    if not store:
        return # Cannot payout if store doesn't exist
        
    artist_id = store.owner_id
    
    # Do not payout if amount is 0
    if order.final_amount <= 0:
        return
        
    # Get or create the artist's wallet
    artist_wallet = ensure_wallet_exists(db, artist_id)
    
    # Check if a payout for this order has already been made to avoid double-payouts
    existing_txn = db.query(WalletTransaction).filter(
        WalletTransaction.wallet_id == artist_wallet.id,
        WalletTransaction.reference_id == str(order.id),
        WalletTransaction.transaction_type == WalletTransactionTypeEnum.PAYMENT,
        WalletTransaction.amount > 0
    ).first()
    
    if existing_txn:
        return # Already paid out
        
    balance_before = artist_wallet.balance
    payout_amount = Decimal(str(order.final_amount)) # 100% of final amount, no fees for now
    artist_wallet.balance += payout_amount
    
    # Create the incoming transaction log
    payout_txn = WalletTransaction(
        wallet_id=artist_wallet.id,
        transaction_type=WalletTransactionTypeEnum.PAYMENT,
        amount=payout_amount, # Positive amount
        balance_before=balance_before,
        balance_after=artist_wallet.balance,
        status=WalletTransactionStatusEnum.SUCCESS,
        reference_id=str(order.id)
    )
    
    db.add(payout_txn)
    db.add(artist_wallet)
    # Note: caller is responsible for calling db.commit()
