import { fireEvent, render } from "@testing-library/react-native";
import { TouchableOpacity } from "react-native";

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
    const { UNSAFE_getByType } = render(
      <Toggle label="Dark Mode" value={true} onToggle={mockOnToggle} />,
    );

    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(mockOnToggle).toHaveBeenCalledWith(false);
  });
});
