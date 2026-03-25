import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SegmentedControl } from "./index";

describe("SegmentedControl", () => {
  it("renders all options", () => {
    const { getByText } = render(
      <SegmentedControl options={["Option A", "Option B", "Option C"]} selectedIndex={0} onChange={jest.fn()} />
    );
    expect(getByText("Option A")).toBeTruthy();
    expect(getByText("Option B")).toBeTruthy();
    expect(getByText("Option C")).toBeTruthy();
  });

  it("calls onChange with correct index when pressed", () => {
    const onChangeMock = jest.fn();
    const { getByText } = render(
      <SegmentedControl options={["Option A", "Option B"]} selectedIndex={0} onChange={onChangeMock} />
    );
    
    fireEvent.press(getByText("Option B"));
    expect(onChangeMock).toHaveBeenCalledWith(1);
  });
});
