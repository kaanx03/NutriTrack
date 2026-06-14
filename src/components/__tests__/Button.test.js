import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import Button from "../Button";

describe("Button", () => {
  it("renders its title", () => {
    render(<Button title="Save" onPress={() => {}} />);
    expect(screen.getByText("Save")).toBeTruthy();
  });

  it("fires onPress when tapped", () => {
    const onPress = jest.fn();
    render(<Button title="Save" onPress={onPress} />);
    fireEvent.press(screen.getByText("Save"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress when disabled", () => {
    const onPress = jest.fn();
    render(<Button title="Save" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText("Save"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("hides the title while loading (spinner shown)", () => {
    render(<Button title="Save" onPress={() => {}} loading />);
    expect(screen.queryByText("Save")).toBeNull();
  });

  it("exposes accessibilityState.disabled via label", () => {
    render(<Button title="Save" onPress={() => {}} disabled />);
    const node = screen.getByLabelText("Save");
    expect(node.props.accessibilityState.disabled).toBe(true);
  });
});
