import { gql } from '@apollo/client';

export const SELLER_REVENUE_STATS_QUERY = gql`
  query SellerRevenueStats($period: String!) {
    sellerRevenueStats(period: $period) {
      totalRevenue
      totalOrders
      chartData {
        date
        revenue
      }
      revenueByCategory {
        categoryName
        revenue
      }
    }
  }
`;
