import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import EmptyState from "../EmptyState";
import ErrorState from "../ErrorState";
import SkeletonBlock from "../Skeleton";

describe("EmptyState", () => {
  it("renders title + message", () => {
    render(<EmptyState title="No meals yet" message="Add your first meal" />);
    expect(screen.getByText("No meals yet")).toBeTruthy();
    expect(screen.getByText("Add your first meal")).toBeTruthy();
  });

  it("fires the action", () => {
    const onAction = jest.fn();
    render(<EmptyState title="Empty" actionLabel="Add" onAction={onAction} />);
    fireEvent.press(screen.getByText("Add"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

describe("ErrorState", () => {
  it("shows generic error + retry fires", () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    fireEvent.press(screen.getByText("Retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows offline variant", () => {
    render(<ErrorState offline />);
    expect(screen.getByText("You're offline")).toBeTruthy();
  });
});

describe("SkeletonBlock", () => {
  it("renders without crashing", () => {
    render(<SkeletonBlock width={100} height={20} />);
  });
});
