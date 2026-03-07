import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { Checkbox } from "./index";

describe("Checkbox Component", () => {
  it("renders the label correctly", () => {
    render(
      <Checkbox label="Accept terms" checked={false} onToggle={jest.fn()} />,
    );
    expect(screen.getByText("Accept terms")).toBeTruthy();
  });

  it("calls onChange when pressed", () => {
    const mockOnChange = jest.fn();
    render(
      <Checkbox label="Accept terms" checked={false} onToggle={mockOnChange} />,
    );

    fireEvent.press(screen.getByText("Accept terms"));
    expect(mockOnChange).toHaveBeenCalled();
  });
});
