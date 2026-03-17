import { render } from "@testing-library/react-native";
import React from "react";
import { Avatar } from "./index";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

describe("Avatar Component", () => {
  it("renders fallback correctly", () => {
    const { getByText } = render(<Avatar fallbackIcon="person" />);
    expect(getByText("person")).toBeTruthy();
  });
});
