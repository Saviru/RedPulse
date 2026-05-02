import { render } from "@testing-library/react-native";
import React from "react";
import { Divider } from "./index";

describe("Divider Component", () => {
  it("renders correctly", () => {
    const { toJSON } = render(<Divider />);
    expect(toJSON()).toBeTruthy();
  });
});
