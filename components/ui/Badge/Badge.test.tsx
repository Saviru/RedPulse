import { render, screen } from "@testing-library/react-native";
import React from "react";
import { Badge } from "./index";

describe("Badge Component", () => {
  it("renders the label correctly", () => {
    render(<Badge label="Completed" />);
    expect(screen.getByText("Completed")).toBeTruthy();
  });
});
