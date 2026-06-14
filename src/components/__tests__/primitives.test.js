import React from "react";
import { Text } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import Card from "../Card";
import ListRow from "../ListRow";
import SectionHeader from "../SectionHeader";

describe("Card", () => {
  it("renders children", () => {
    render(
      <Card>
        <Text>inside</Text>
      </Card>
    );
    expect(screen.getByText("inside")).toBeTruthy();
  });
});

describe("ListRow", () => {
  it("renders title + subtitle", () => {
    render(<ListRow title="Water Tracker" subtitle="2.5 L" emoji="💧" />);
    expect(screen.getByText("Water Tracker")).toBeTruthy();
    expect(screen.getByText("2.5 L")).toBeTruthy();
  });

  it("fires onPress", () => {
    const onPress = jest.fn();
    render(<ListRow title="Profile" onPress={onPress} />);
    fireEvent.press(screen.getByText("Profile"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders a custom right node instead of chevron", () => {
    render(<ListRow title="Biometric" right={<Text>SWITCH</Text>} />);
    expect(screen.getByText("SWITCH")).toBeTruthy();
  });
});

describe("SectionHeader", () => {
  it("renders the title", () => {
    render(<SectionHeader title="Your Plan" />);
    expect(screen.getByText("Your Plan")).toBeTruthy();
  });

  it("renders action and fires onActionPress", () => {
    const onActionPress = jest.fn();
    render(
      <SectionHeader
        title="Activity"
        actionLabel="View All"
        onActionPress={onActionPress}
      />
    );
    fireEvent.press(screen.getByText("View All"));
    expect(onActionPress).toHaveBeenCalledTimes(1);
  });
});
