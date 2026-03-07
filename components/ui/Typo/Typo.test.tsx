import { render } from "@testing-library/react-native";
import React from "react";
import { Typo } from "./index";

describe("Typo Component", () => {
  it("renders text content", () => {
    const { getByText } = render(<Typo>Hello World</Typo>);
    expect(getByText("Hello World")).toBeTruthy();
  });
});
