import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { DURATION, useReducedMotion } from "../motion";

describe("motion util", () => {
  it("DURATION scale is 150 / 220 / 300", () => {
    expect(DURATION.fast).toBe(150);
    expect(DURATION.base).toBe(220);
    expect(DURATION.slow).toBe(300);
  });

  it("useReducedMotion defaults to false (no crash)", () => {
    function Probe() {
      const reduced = useReducedMotion();
      return <Text>{`reduced:${reduced}`}</Text>;
    }
    render(<Probe />);
    expect(screen.getByText("reduced:false")).toBeTruthy();
  });
});
