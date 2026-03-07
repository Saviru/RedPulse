import { render, screen } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import { Card } from "./index";

describe("Card Component", () => {
  it("renders the content", () => {
    render(
      <Card>
        <Text>Inner content</Text>
      </Card>,
    );
    expect(screen.getByText("Inner content")).toBeTruthy();
  });
});
