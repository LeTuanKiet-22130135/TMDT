import { describe, it, expect } from "vitest";
import { maskName, maskEmail, exportToExcel } from "../OrdersPage.logic";
import { MOCK_ORDERS } from "./mockData";

describe("maskName", () => {
  it("che ten giu lai ho", () => {
    expect(maskName("Nguyễn Văn An")).toBe("Nguyễn A***");
  });

  it("xu ly ten don chi co 1 chu", () => {
    expect(maskName("An")).toBe("A***");
  });

  it("giu nguyen neu ten qua ngan", () => {
    expect(maskName("A")).toBe("A");
  });
});

describe("maskEmail", () => {
  it("che phan local giu lai domain", () => {
    expect(maskEmail("an@example.com")).toBe("an***@example.com");
  });

  it("chi giu 2 ky tu dau cua local", () => {
    expect(maskEmail("binh@example.com")).toBe("bi***@example.com");
  });
});

describe("exportToExcel", () => {
  it("khong throw loi khi xuat voi mock data", () => {
    expect(() =>
      exportToExcel({ orders: MOCK_ORDERS, statusFilter: "", generatedBy: "Admin" })
    ).not.toThrow();
  });

  it("khong throw loi khi xuat voi filter trang thai", () => {
    const filtered = MOCK_ORDERS.filter((o) => o.status === "completed");
    expect(() =>
      exportToExcel({ orders: filtered, statusFilter: "completed", generatedBy: "Admin" })
    ).not.toThrow();
  });
});