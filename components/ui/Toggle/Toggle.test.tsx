import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Toggle } from "./index";

describe("Toggle Component", () => {
  it("renders label", () => {
    const { getByText } = render(
      <Toggle
        label="Enable Notifications"
        value={false}
        onToggle={jest.fn()}
      />,
    );
    expect(getByText("Enable Notifications")).toBeTruthy();
  });

  it("calls onToggle when pressed", () => {
    const mockOnToggle = jest.fn();
    // Testing library might map the press to the container holding the label
    const { getByText } = render(
      <Toggle label="Dark Mode" value={false} onToggle={mockOnToggle} />,
    );

    fireEvent.press(getByText("Dark Mode"));
    expect(mockOnToggle).toHaveBeenCalled();
  });
});
