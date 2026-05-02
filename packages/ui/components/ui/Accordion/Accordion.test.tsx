import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Accordion } from "./index";

describe("Accordion", () => {
  it("renders title correctly and hides content initially", () => {
    const { getByText, queryByText } = render(
      <Accordion title="Accordion Title" content="Accordion Content" />
    );
    
    expect(getByText("Accordion Title")).toBeTruthy();
    expect(queryByText("Accordion Content")).toBeNull();
  });

  it("shows content when pressed", () => {
    const { getByText, queryByText } = render(
      <Accordion title="Accordion Title" content="Accordion Content" />
    );
    
    // Press the header
    fireEvent.press(getByText("Accordion Title"));
    
    // Now content should be visible
    expect(getByText("Accordion Content")).toBeTruthy();
  });

  it("hides content when pressed again", () => {
    const { getByText, queryByText } = render(
      <Accordion title="Accordion Title" content="Accordion Content" />
    );
    
    const header = getByText("Accordion Title");
    fireEvent.press(header); // expand
    expect(getByText("Accordion Content")).toBeTruthy();
    
    fireEvent.press(header); // collapse
    expect(queryByText("Accordion Content")).toBeNull();
  });
});
