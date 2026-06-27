import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import LoginPage from "../LoginPage";

const renderLoginPage = () =>
  render(
    <MockedProvider mocks={[]}>
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    </MockedProvider>
  );

describe("LoginPage", () => {
  it("renders login form", () => {
    renderLoginPage();
    expect(screen.getByText("Lumine Admin")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("admin@lumine.vn")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("shows error when submitting empty form", async () => {
    renderLoginPage();
    const button = screen.getByRole("button", { name: /đăng nhập/i });
    await userEvent.click(button);
    expect(screen.getByText("Vui lòng nhập đầy đủ thông tin")).toBeInTheDocument();
  });
});
