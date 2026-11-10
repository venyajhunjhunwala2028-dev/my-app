import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ContactPage from "@/app/contact/page";
import PrivacyPage from "@/app/privacy/page";
import RefundsPage from "@/app/refunds/page";
import TermsPage from "@/app/terms/page";
import { BUSINESS, isPlaceholder } from "@/lib/business";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("legal pages", () => {
  it("every business detail is still a clearly marked placeholder (the owner fills them in)", () => {
    for (const key of ["name", "statementName", "email", "phone", "address", "lastUpdated"] as const) {
      expect(isPlaceholder(BUSINESS[key]), key).toBe(true);
    }
  });

  it("Privacy describes the app accurately: AI answers, the phone's storage, Razorpay, nothing stored by us", () => {
    render(<PrivacyPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Privacy policy" })).toBeInTheDocument();
    expect(screen.getByText(/sent through our server to Anthropic’s AI service/)).toBeInTheDocument();
    expect(screen.getByText(/We do not\s+store it on our servers/)).toBeInTheDocument();
    expect(screen.getByText(/your subscription id \(your restore code\)/)).toBeInTheDocument();
    expect(screen.getByText(/we never see or store them/)).toBeInTheDocument();
  });

  it("Refunds: cancel anytime, access to the end of the paid month, no partial refunds except where the law requires", () => {
    render(<RefundsPage />);
    expect(screen.getByText(/Plus stays on until the end of the month you have already paid for/)).toBeInTheDocument();
    expect(screen.getByText(/We do not give partial refunds for the unused part of a month, except where the law requires it/)).toBeInTheDocument();
    expect(screen.getAllByText(BUSINESS.email).length).toBeGreaterThan(0);
  });

  it("Terms and Contact name the price, the business and the statement name", () => {
    render(<TermsPage />);
    expect(screen.getByText(/Plus costs ₹99 a month/)).toBeInTheDocument();
    render(<ContactPage />);
    expect(screen.getByText(new RegExp(`shows as\\s+${BUSINESS.statementName.replace(/[[\]]/g, "\\$&")}`))).toBeInTheDocument();
  });
});
