from uuid import UUID

import strawberry
from strawberry.types import Info

from app.models import User, Product, Store, Report, RoleEnum, ReportStatusEnum
from app.graphql.types import to_user_type, to_product_type, to_store_type, to_report_type, UserType, ProductType, StoreType, ReportType, WalletTransactionType, to_wallet_transaction_type
from app.graphql.mutations.utils import _db

@strawberry.type
class AdminMutation:
    @strawberry.mutation
    def banUser(self, info: Info, userId: UUID) -> UserType:
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Không có quyền thực hiện thao tác này")
        
        db = _db(info)
        target_user = db.get(User, userId)
        if target_user is None:
            raise Exception("Không tìm thấy người dùng")
            
        target_user.is_active = False
        db.add(target_user)
        db.commit()
        db.refresh(target_user)
        return to_user_type(target_user)

    @strawberry.mutation
    def unbanUser(self, info: Info, userId: UUID) -> UserType:
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Không có quyền thực hiện thao tác này")
        
        db = _db(info)
        target_user = db.get(User, userId)
        if target_user is None:
            raise Exception("Không tìm thấy người dùng")
            
        target_user.is_active = True
        db.add(target_user)
        db.commit()
        db.refresh(target_user)
        return to_user_type(target_user)

    @strawberry.mutation
    def adminToggleProduct(self, info: Info, productId: UUID) -> ProductType:
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Không có quyền thực hiện thao tác này")
        
        db = _db(info)
        product = db.get(Product, productId)
        if product is None:
            raise Exception("Không tìm thấy sản phẩm")
            
        product.is_active = not product.is_active
        db.add(product)
        db.commit()
        db.refresh(product)
        return to_product_type(product)

    @strawberry.mutation
    def adminToggleStore(self, info: Info, storeId: UUID) -> StoreType:
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Không có quyền thực hiện thao tác này")
        
        db = _db(info)
        store = db.get(Store, storeId)
        if store is None:
            raise Exception("Không tìm thấy cửa hàng")
            
        store.is_active = not store.is_active
        db.add(store)
        db.commit()
        db.refresh(store)
        return to_store_type(store)

    @strawberry.mutation
    def resolveReport(self, info: Info, reportId: UUID) -> ReportType:
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Không có quyền thực hiện thao tác này")
        
        db = _db(info)
        report = db.get(Report, reportId)
        if report is None:
            raise Exception("Không tìm thấy báo cáo")
            
        report.status = ReportStatusEnum.RESOLVED
        db.add(report)
        db.commit()
        db.refresh(report)
        return to_report_type(report)

    @strawberry.mutation
    def approveWithdrawal(self, info: Info, transactionId: UUID) -> WalletTransactionType:
        from app.models.entities import WalletTransaction, WalletTransactionStatusEnum, WalletTransactionTypeEnum
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Không có quyền thực hiện thao tác này")
        
        db = _db(info)
        txn = db.query(WalletTransaction).filter(WalletTransaction.id == transactionId).with_for_update().first()
        if txn is None:
            raise Exception("Không tìm thấy giao dịch")
            
        if txn.transaction_type != WalletTransactionTypeEnum.WITHDRAWAL:
            raise Exception("Giao dịch này không phải là yêu cầu rút tiền")
            
        if txn.status != WalletTransactionStatusEnum.PENDING:
            raise Exception("Chỉ có thể duyệt các yêu cầu đang chờ xử lý")
            
        txn.status = WalletTransactionStatusEnum.SUCCESS
        db.add(txn)
        db.commit()
        db.refresh(txn)
        
        return to_wallet_transaction_type(txn)

    @strawberry.mutation
    def rejectWithdrawal(self, info: Info, transactionId: UUID) -> WalletTransactionType:
        from app.models.entities import WalletTransaction, WalletTransactionStatusEnum, WalletTransactionTypeEnum, Wallet
        user = info.context.get("current_user")
        if user is None or user.role != RoleEnum.ADMIN:
            raise Exception("Không có quyền thực hiện thao tác này")
        
        db = _db(info)
        txn = db.query(WalletTransaction).filter(WalletTransaction.id == transactionId).with_for_update().first()
        if txn is None:
            raise Exception("Không tìm thấy giao dịch")
            
        if txn.transaction_type != WalletTransactionTypeEnum.WITHDRAWAL:
            raise Exception("Giao dịch này không phải là yêu cầu rút tiền")
            
        if txn.status != WalletTransactionStatusEnum.PENDING:
            raise Exception("Chỉ có thể từ chối các yêu cầu đang chờ xử lý")
            
        # Refund the money to wallet
        wallet = db.query(Wallet).filter(Wallet.id == txn.wallet_id).with_for_update().first()
        if wallet:
            wallet.balance += txn.amount
            db.add(wallet)
            
        txn.status = WalletTransactionStatusEnum.FAILED
        db.add(txn)
        db.commit()
        db.refresh(txn)
        
        return to_wallet_transaction_type(txn)
