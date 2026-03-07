import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { Button } from "./index";

describe("Button Component", () => {
  it("renders the label correctly", () => {
    render(<Button label="Submit" onPress={() => {}} />);

    // Checks if the text exists on the screen
    expect(screen.getByText("Submit")).toBeTruthy();
  });

  it("calls onPress when physically tapped", () => {
    const mockOnPress = jest.fn(); // Create a spy function
    render(<Button label="Tap Me" onPress={mockOnPress} />);

    // Simulate a user pressing the button
    fireEvent.press(screen.getByText("Tap Me"));

    // Verify the function was executed
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const mockOnPress = jest.fn();
    render(<Button label="Disabled" onPress={mockOnPress} disabled={true} />);

    const buttonElement = screen.getByText("Disabled");
    fireEvent.press(buttonElement);

    expect(mockOnPress).not.toHaveBeenCalled();
  });
});
