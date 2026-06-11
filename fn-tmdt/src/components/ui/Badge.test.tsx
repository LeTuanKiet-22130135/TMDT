import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Badge } from "./Badge"

describe("Badge Component", () => {
  it("nên render nội dung của badge một cách chính xác", () => {
    render(<Badge>Test Tag</Badge>)
    expect(screen.getByText("Test Tag")).toBeInTheDocument()
  })

  it("nên áp dụng class variant tương ứng", () => {
    const { container } = render(<Badge variant="secondary">Secondary Tag</Badge>)
    expect(container.firstChild).toHaveClass("bg-[#F65C88]/15")
  })
})
