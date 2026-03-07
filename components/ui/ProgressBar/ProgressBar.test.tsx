import { render } from "@testing-library/react-native";
import React from "react";
import { ProgressBar } from "./index";

describe("ProgressBar Component", () => {
  it("renders correctly without crashing", () => {
    const { toJSON } = render(<ProgressBar progress={50} />);
    expect(toJSON()).toBeTruthy();
  });
});
