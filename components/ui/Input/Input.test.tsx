import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Input } from "./index";

describe("Input Component", () => {
  it("renders placeholder text", () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter username" />,
    );
    expect(getByPlaceholderText("Enter username")).toBeTruthy();
  });

  it("calls onChangeText when text changes", () => {
    const mockOnChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter email" onChangeText={mockOnChangeText} />,
    );

    fireEvent.changeText(
      getByPlaceholderText("Enter email"),
      "test@domain.com",
    );
    expect(mockOnChangeText).toHaveBeenCalledWith("test@domain.com");
  });
});
