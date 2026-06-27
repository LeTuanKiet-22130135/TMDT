import type { Order } from "../OrdersPage.logic";

export const MOCK_ORDERS: Order[] = [
  {
    id: "a1b2c3d4-0001-0001-0001-000000000001",
    status: "completed",
    totalAmount: 1800000,
    createdAt: "2025-06-01T10:30:00Z",
    buyer: { id: "u1", username: "Nguyễn Văn An", email: "an@example.com" },
  },
  {
    id: "a1b2c3d4-0002-0002-0002-000000000002",
    status: "pending",
    totalAmount: 950000,
    createdAt: "2025-06-03T08:15:00Z",
    buyer: { id: "u2", username: "Trần Thị Bình", email: "binh@example.com" },
  },
  {
    id: "a1b2c3d4-0003-0003-0003-000000000003",
    status: "processing",
    totalAmount: 2300000,
    createdAt: "2025-06-05T14:00:00Z",
    buyer: { id: "u3", username: "Lê Minh Châu", email: "chau@example.com" },
  },
  {
    id: "a1b2c3d4-0004-0004-0004-000000000004",
    status: "cancelled",
    totalAmount: 450000,
    createdAt: "2025-06-07T09:45:00Z",
    buyer: { id: "u4", username: "Phạm Thị Dung", email: "dung@example.com" },
  },
  {
    id: "a1b2c3d4-0005-0005-0005-000000000005",
    status: "completed",
    totalAmount: 3200000,
    createdAt: "2025-06-10T16:20:00Z",
    buyer: { id: "u5", username: "Hoàng Văn Em", email: "em@example.com" },
  },
  {
    id: "a1b2c3d4-0006-0006-0006-000000000006",
    status: "completed",
    totalAmount: 750000,
    createdAt: "2025-06-12T11:00:00Z",
    buyer: { id: "u6", username: "Vũ Thị Phương", email: "phuong@example.com" },
  },
  {
    id: "a1b2c3d4-0007-0007-0007-000000000007",
    status: "pending",
    totalAmount: 1200000,
    createdAt: "2025-06-15T13:30:00Z",
    buyer: { id: "u7", username: "Đặng Văn Giang", email: "giang@example.com" },
  },
];