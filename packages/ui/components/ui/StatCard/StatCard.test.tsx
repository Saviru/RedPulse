import { render } from "@testing-library/react-native";
import React from "react";
import { StatCard } from "./index";

describe("StatCard Component", () => {
  it("renders label and value", () => {
    const { getByText } = render(
      <StatCard label="Total Users" value="1,024" />,
    );
    expect(getByText("Total Users")).toBeTruthy();
    expect(getByText("1,024")).toBeTruthy();
  });
});
