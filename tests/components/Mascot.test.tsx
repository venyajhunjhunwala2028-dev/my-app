import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Mascot, { MASCOT_MOODS } from "@/components/Mascot";

describe("Mascot", () => {
  it.each(MASCOT_MOODS)("renders the %s mood", (mood) => {
    render(<Mascot mood={mood} />);
    expect(screen.getByTestId("mascot")).toHaveAttribute("data-mood", mood);
  });

  it("draws a different face for each mood", () => {
    const faces = MASCOT_MOODS.map((mood) => {
      const { container, unmount } = render(<Mascot mood={mood} animate={false} />);
      const html = container.innerHTML;
      unmount();
      return html.replace(/data-mood="[a-z]+"/, "");
    });
    expect(new Set(faces).size).toBe(MASCOT_MOODS.length);
  });

  it("is hidden from screen readers by default", () => {
    render(<Mascot />);
    expect(screen.getByTestId("mascot")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("can be labelled, and shows a speech bubble", () => {
    render(
      <Mascot mood="celebrate" label="Tech Helper is cheering">
        Hi! I&apos;m your Tech Helper
      </Mascot>,
    );
    expect(screen.getByRole("img", { name: "Tech Helper is cheering" })).toBeInTheDocument();
    expect(screen.getByText("Hi! I'm your Tech Helper")).toBeInTheDocument();
  });

  it("bobs gently only when animate is on", () => {
    const { rerender } = render(<Mascot />);
    expect(screen.getByTestId("mascot").getAttribute("class")).toContain("animate-float");
    rerender(<Mascot animate={false} />);
    expect(screen.getByTestId("mascot").getAttribute("class")).not.toContain("animate-float");
  });
});
