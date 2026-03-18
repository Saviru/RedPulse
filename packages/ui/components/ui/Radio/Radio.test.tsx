import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Radio } from "./index";

describe("Radio Component", () => {
  it("renders the correct label", () => {
    const { getByText } = render(
      <Radio label="Option 1" selected={false} onSelect={jest.fn()} />,
    );
    expect(getByText("Option 1")).toBeTruthy();
  });

  it("calls onChange when tapped", () => {
    const mockOnChange = jest.fn();
    const { getByText } = render(
      <Radio label="Option 2" selected={false} onSelect={mockOnChange} />,
    );

    fireEvent.press(getByText("Option 2"));
    expect(mockOnChange).toHaveBeenCalled();
  });
});
