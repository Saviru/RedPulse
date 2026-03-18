import { render } from "@testing-library/react-native";
import React from "react";
import { Select } from "./index";

describe("Select Component", () => {
  it("renders placeholder correctly", () => {
    const { getByText } = render(
      <Select
        options={["A", "B"]}
        value=""
        onSelect={jest.fn()}
        placeholder="Choose..."
      />,
    );
    expect(getByText("Choose...")).toBeTruthy();
  });
});
