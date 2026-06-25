import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { MemoryRouter } from "react-router-dom";
import ReportsPage from "../ReportsPage";
import { GET_ALL_REPORTS } from "@/services/graphql/admin.graphql";

const mockReportsData = {
  adminReports: {
    items: [
      {
        id: "r1",
        reporterId: "u1",
        reportedStoreId: "s1",
        reportedUserId: null,
        reportType: "STORE_VIOLATION",
        reason: "Cửa hàng bán tranh vẽ AI không xin phép tác quyền",
        status: "PENDING",
        createdAt: "2026-06-19T00:00:00Z",
        reporter: {
          id: "u1",
          email: "reporter@lumine.vn",
          username: "reporter",
        },
        reportedStore: {
          id: "s1",
          name: "Mina's Art Station",
        },
        reportedUser: null,
      },
    ],
    totalItems: 1,
    totalPages: 1,
  },
};

const mocks = [
  {
    request: {
      query: GET_ALL_REPORTS,
      variables: { page: 1, limit: 15 },
    },
    result: {
      data: mockReportsData,
    },
  },
];

describe("ReportsPage", () => {
  it("renders reports page with table and resolve button", async () => {
    render(
      <MockedProvider mocks={mocks} >
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(screen.getByText("Báo cáo vi phạm")).toBeInTheDocument();
    
    // Đợi tải dữ liệu
    const reporterName = await screen.findByText("reporter");
    expect(reporterName).toBeInTheDocument();
    expect(screen.getByText("Mina's Art Station")).toBeInTheDocument();
    expect(screen.getByText("Cửa hàng vi phạm")).toBeInTheDocument();
    expect(screen.getByText("Cửa hàng bán tranh vẽ AI không xin phép tác quyền")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Xử lý/i })).toBeInTheDocument();
  });
});
