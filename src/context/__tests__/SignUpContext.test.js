import React from "react";
import { Text, Pressable } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { SignUpProvider, useSignUp } from "../SignUpContext";

// Hook'u render üzerinden test eden küçük prob bileşeni.
function Probe() {
  const { formData, updateFormData, updateMultipleFields } = useSignUp();
  return (
    <>
      <Text>{`name:${formData.firstName || "none"}`}</Text>
      <Text>{`hw:${formData.height || "?"}/${formData.weight || "?"}`}</Text>
      <Pressable testID="setName" onPress={() => updateFormData("firstName", "Kaan")}>
        <Text>setName</Text>
      </Pressable>
      <Pressable
        testID="setHW"
        onPress={() => updateMultipleFields({ height: 180, weight: 80 })}
      >
        <Text>setHW</Text>
      </Pressable>
    </>
  );
}

describe("SignUpContext", () => {
  it("updates a single field via updateFormData", () => {
    render(
      <SignUpProvider>
        <Probe />
      </SignUpProvider>
    );
    expect(screen.getByText("name:none")).toBeTruthy();
    fireEvent.press(screen.getByTestId("setName"));
    expect(screen.getByText("name:Kaan")).toBeTruthy();
  });

  it("updates multiple fields via updateMultipleFields", () => {
    render(
      <SignUpProvider>
        <Probe />
      </SignUpProvider>
    );
    fireEvent.press(screen.getByTestId("setHW"));
    expect(screen.getByText("hw:180/80")).toBeTruthy();
  });

  it("throws when used outside its provider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/must be used within a SignUpProvider/);
    spy.mockRestore();
  });
});
