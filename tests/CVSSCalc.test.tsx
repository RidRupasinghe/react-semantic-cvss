import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CVSSCalc } from "../src/CVSSCalc";

describe("CVSSCalc React Component", () => {
  it("renders with default title and pending state", () => {
    render(<CVSSCalc />);
    expect(screen.getByText("Common Vulnerability Scoring System")).toBeDefined();
    expect(screen.getByText("Pending")).toBeDefined();
  });

  it("renders with a pre-filled valid CVSS 3.1 vector", () => {
    const vector = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H";
    render(<CVSSCalc vector={vector} />);

    // Should display score 10.0 and Critical
    expect(screen.getByText("10.0")).toBeDefined();
    expect(screen.getByText("Critical")).toBeDefined();
  });

  it("fires onChange callback when a metric option is clicked", () => {
    const handleChange = vi.fn();
    render(<CVSSCalc onChange={handleChange} />);

    // Click Network for Attack Vector
    const networkButton = screen.getByRole("radio", { name: /Attack Vector: Network/i });
    fireEvent.click(networkButton);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const output = handleChange.mock.calls[0][0];
    expect(output.selections.AV).toBe("N");
  });

  it("does not allow selection in readOnly mode", () => {
    const handleChange = vi.fn();
    render(<CVSSCalc readOnly={true} onChange={handleChange} />);

    const networkButton = screen.getByRole("radio", { name: /Attack Vector: Network/i });
    fireEvent.click(networkButton);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it("displays error message when an invalid vector is passed", () => {
    render(<CVSSCalc vector="CVSS:3.1/AV:INVALID" />);
    expect(screen.getByText("Invalid Option Value")).toBeDefined();
  });

  it("does not wipe user selections when parent re-renders with the same vector (controlled component bug fix)", () => {
    const { rerender } = render(<CVSSCalc vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H" />);
    expect(screen.getByText("10.0")).toBeDefined();

    // Rerender with the identical vector
    rerender(<CVSSCalc vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H" />);
    expect(screen.getByText("10.0")).toBeDefined();
    expect(screen.queryByText("Pending")).toBeNull();
  });
});
