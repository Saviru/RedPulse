import { render } from "@testing-library/react-native";
import React from "react";
import { Avatar } from "./index";

describe("Avatar Component", () => {
  it("renders fallback correctly", () => {
    const { getByText } = render(<Avatar fallbackIcon="person" />);
    expect(getByText("person")).toBeTruthy();
  });
});
