import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Wordmark, { BrandGlyph } from "@/components/brand/Wordmark";

describe("Wordmark", () => {
  it("reads 'tech helper' in ink with a blue spark by default", () => {
    render(<Wordmark />);
    const mark = screen.getByTestId("wordmark");
    expect(mark).toHaveTextContent("tech helper");
    expect(mark).toHaveAttribute("data-tone", "ink");
    expect(mark).toHaveClass("font-brand", "text-foreground");
    expect(mark).toHaveStyle({ fontSize: "1.5rem" });
    const glyph = screen.getByTestId("brand-glyph");
    expect(glyph).toHaveAttribute("aria-hidden", "true");
    expect(glyph).toHaveClass("text-primary");
  });

  it("has a white variant for blue and night backgrounds, with a white spark", () => {
    render(<Wordmark tone="white" size={3} />);
    const mark = screen.getByTestId("wordmark");
    expect(mark).toHaveAttribute("data-tone", "white");
    expect(mark).toHaveClass("text-white");
    expect(mark).not.toHaveClass("text-foreground");
    expect(mark).toHaveStyle({ fontSize: "3rem" });
    expect(screen.getByTestId("brand-glyph")).not.toHaveClass("text-primary");
  });

  it("can keep a blue spark on white text, take any CSS size, and drop the spark", () => {
    const { rerender } = render(<Wordmark tone="white" accent="blue" size="1em" />);
    expect(screen.getByTestId("brand-glyph")).toHaveClass("text-primary");
    expect(screen.getByTestId("wordmark")).toHaveStyle({ fontSize: "1em" });
    rerender(<Wordmark glyph={false} />);
    expect(screen.queryByTestId("brand-glyph")).not.toBeInTheDocument();
    expect(screen.getByTestId("wordmark")).toHaveTextContent("tech helper");
  });

  it("draws the spark as eight rounded spokes, hidden from screen readers", () => {
    const { container } = render(<BrandGlyph className="h-4 w-4" />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg.querySelectorAll("path")).toHaveLength(4);
    expect(svg.querySelector("g")).toHaveAttribute("stroke-linecap", "round");
  });
});
