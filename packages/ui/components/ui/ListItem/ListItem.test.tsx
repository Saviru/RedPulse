import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { ListItem } from "./index";

describe("ListItem Component", () => {
  it("renders title and subtitle", () => {
    const { getByText } = render(
      <ListItem title="Main title" subtitle="Sub title" />,
    );
    expect(getByText("Main title")).toBeTruthy();
    expect(getByText("Sub title")).toBeTruthy();
  });

  it("handles custom onPress", () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <ListItem title="Click me" onPress={mockOnPress} />,
    );

    fireEvent.press(getByText("Click me"));
    expect(mockOnPress).toHaveBeenCalled();
  });
});
