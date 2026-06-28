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
