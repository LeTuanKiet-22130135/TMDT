import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      user {
        id
        email
        fullName
        role
      }
    }
  }
`;

export const GET_ADMIN_STATS = gql`
  query AdminStats {
    adminStats {
      totalUsers
      totalOrders
      totalProducts
      totalStores
      totalRevenue
      pendingOrders
    }
  }
`;

export const GET_ALL_USERS = gql`
  query AdminUsers($page: Int, $limit: Int, $q: String) {
    adminUsers(page: $page, limit: $limit, q: $q) {
      items {
        id
        email
        username
        role
        isActive
        createdAt
      }
      totalItems
      totalPages
    }
  }
`;

export const GET_ALL_ORDERS = gql`
  query AdminOrders($page: Int, $limit: Int, $status: String) {
    adminOrders(page: $page, limit: $limit, status: $status) {
      items {
        id
        status
        totalAmount
        createdAt
        buyer {
          id
          username
          email
        }
      }
      totalItems
      totalPages
    }
  }
`;

export const GET_ALL_PRODUCTS = gql`
  query AdminProducts($page: Int, $limit: Int, $q: String) {
    adminProducts(page: $page, limit: $limit, q: $q) {
      items {
        id
        name
        price
        stock
        isActive
        store {
          id
          name
        }
      }
      totalItems
      totalPages
    }
  }
`;

export const GET_ALL_STORES = gql`
  query AdminStores($page: Int, $limit: Int, $q: String) {
    adminStores(page: $page, limit: $limit, q: $q) {
      items {
        id
        name
        isActive
        createdAt
        owner {
          id
          username
          email
        }
      }
      totalItems
      totalPages
    }
  }
`;

export const BAN_USER_MUTATION = gql`
  mutation BanUser($userId: UUID!) {
    banUser(userId: $userId) {
      id
      isActive
    }
  }
`;

export const UNBAN_USER_MUTATION = gql`
  mutation UnbanUser($userId: UUID!) {
    unbanUser(userId: $userId) {
      id
      isActive
    }
  }
`;

export const TOGGLE_PRODUCT_MUTATION = gql`
  mutation ToggleProduct($productId: UUID!) {
    adminToggleProduct(productId: $productId) {
      id
      isActive
    }
  }
`;

export const TOGGLE_STORE_MUTATION = gql`
  mutation ToggleStore($storeId: UUID!) {
    adminToggleStore(storeId: $storeId) {
      id
      isActive
    }
  }
`;

export const GET_ALL_REPORTS = gql`
  query AdminReports($page: Int, $limit: Int) {
    adminReports(page: $page, limit: $limit) {
      items {
        id
        reporterId
        reportedStoreId
        reportedUserId
        reportType
        reason
        status
        createdAt
        reporter {
          id
          email
          username
        }
        reportedStore {
          id
          name
        }
        reportedUser {
          id
          email
          username
        }
      }
      totalItems
      totalPages
    }
  }
`;

export const RESOLVE_REPORT_MUTATION = gql`
  mutation ResolveReport($reportId: UUID!) {
    resolveReport(reportId: $reportId) {
      id
      status
    }
  }
`;

export const GET_ADMIN_REVENUE_CHART = gql`
  query AdminRevenueChart($timePeriod: String!) {
    adminRevenueChart(timePeriod: $timePeriod) {
      date
      revenue
    }
  }
`;

export const GET_ADMIN_CATEGORY_REVENUE = gql`
  query AdminCategoryRevenue($timePeriod: String!) {
    adminCategoryRevenue(timePeriod: $timePeriod) {
      name
      value
      color
    }
  }
`;


