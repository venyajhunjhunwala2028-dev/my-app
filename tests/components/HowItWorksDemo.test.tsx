import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HowItWorksDemo from "@/components/landing/HowItWorksDemo";

describe("See how Tech Helper works demo", () => {
  it("walks from the question through 4 steps to You did it, with clicks", async () => {
    render(<HowItWorksDemo />);
    expect(screen.getAllByText("How do I post on Instagram?").length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Open Instagram" })).toHaveFocus();

    await userEvent.click(screen.getByRole("button", { name: "I did it" }));
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tap the + button" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "I did it" }));
    await userEvent.click(screen.getByRole("button", { name: "I did it" }));
    expect(screen.getByRole("heading", { name: "Tap Share" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "I did it" }));
    expect(screen.getByRole("heading", { name: /You did it!/ })).toHaveFocus();

    await userEvent.click(screen.getByRole("button", { name: "Start again" }));
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
  });

  it("Show me where and I'm stuck give a small hint without moving on", async () => {
    render(<HowItWorksDemo />);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Show me where" }));
    expect(screen.getByText(/Look for the glowing circle/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show me where" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "I'm stuck" }));
    expect(screen.getByText(/send me a screenshot/)).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    // Moving on clears the hint.
    await userEvent.click(screen.getByRole("button", { name: "I did it" }));
    expect(screen.queryByText(/send me a screenshot/)).not.toBeInTheDocument();
  });

  it("works with the keyboard only", async () => {
    const user = userEvent.setup();
    render(<HowItWorksDemo />);
    await user.tab();
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    // Focus moved to the step heading; the next Tab reaches "I did it".
    await user.tab();
    expect(screen.getByRole("button", { name: "I did it" })).toHaveFocus();
    for (let i = 0; i < 4; i++) await user.keyboard(" ");
    expect(screen.getByRole("heading", { name: /You did it!/ })).toBeInTheDocument();
  });
});
