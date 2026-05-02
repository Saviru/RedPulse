import { render } from "@testing-library/react-native";
import React from "react";

import { DatePicker } from "./index";

describe("DatePicker Component", () => {
  it("renders without crashing", () => {
    const { toJSON } = render(
      <DatePicker onChange={jest.fn()} label="Birthday" />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
