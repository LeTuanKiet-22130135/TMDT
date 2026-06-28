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
