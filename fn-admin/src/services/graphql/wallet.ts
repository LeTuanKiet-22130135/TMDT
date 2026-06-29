import { gql } from '@apollo/client';

export const MY_WALLET_QUERY = gql`
  query MyWallet {
    myWallet {
      id
      userId
      balance
      status
      createdAt
      updatedAt
      transactions {
        id
        walletId
        amount
        balanceBefore
        balanceAfter
        transactionType
        status
        referenceId
        createdAt
      }
    }
  }
`;

export const ADMIN_WITHDRAWALS_QUERY = gql`
  query AdminWithdrawalRequests($status: String) {
    adminWithdrawalRequests(status: $status) {
      id
      walletId
      amount
      balanceBefore
      balanceAfter
      transactionType
      status
      referenceId
      createdAt
    }
  }
`;

export const ADMIN_WALLET_STATS_QUERY = gql`
  query AdminWalletStats {
    adminWalletStats {
      totalTopup
      totalPayment
      totalRefund
      totalWithdrawal
      totalInflow
      totalOutflow
      totalTurnover
    }
  }
`;

export const ADMIN_ALL_WALLET_TRANSACTIONS_QUERY = gql`
  query AdminAllWalletTransactions($transactionType: String, $status: String, $page: Int, $limit: Int) {
    adminAllWalletTransactions(transactionType: $transactionType, status: $status, page: $page, limit: $limit) {
      items {
        id
        walletId
        transactionType
        amount
        balanceBefore
        balanceAfter
        status
        referenceId
        createdAt
        userEmail
        userId
      }
      totalItems
      totalPages
    }
  }
`;

export const APPROVE_WITHDRAWAL_MUTATION = gql`
  mutation ApproveWithdrawal($transactionId: UUID!) {
    approveWithdrawal(transactionId: $transactionId) {
      id
      status
    }
  }
`;

export const REJECT_WITHDRAWAL_MUTATION = gql`
  mutation RejectWithdrawal($transactionId: UUID!) {
    rejectWithdrawal(transactionId: $transactionId) {
      id
      status
    }
  }
`;
