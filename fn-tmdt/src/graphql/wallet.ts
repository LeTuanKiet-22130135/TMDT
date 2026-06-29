import { gql } from '@apollo/client';

export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  transactionType: string;
  status: string;
  referenceId: string | null;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  transactions: WalletTransaction[];
}

export interface MyWalletData {
  myWallet: Wallet | null;
}

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

export const REQUEST_WITHDRAWAL_MUTATION = gql`
  mutation RequestWithdrawal($amount: Float!, $bankDetails: String!) {
    requestWithdrawal(amount: $amount, bankDetails: $bankDetails) {
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
