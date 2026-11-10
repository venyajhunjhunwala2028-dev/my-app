import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { STORAGE_KEY, setFamilyContact } from "@/lib/store/localStore";
import SafetyNotice from "@/components/SafetyNotice";

describe("SafetyNotice", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEY, "{}");
  });

  it("covers AE2: a scam warning shows the warning and the Call family button", () => {
    setFamilyContact({ name: "Priya", phone: "+44 7700 900123" });
    render(<SafetyNotice kind="scam_warning" message="Never share a code someone asks you for." />);
    expect(screen.getByRole("heading", { name: "Stop — this looks like a scam" })).toBeInTheDocument();
    expect(screen.getByText("Never share a code someone asks you for.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Call/ })).toHaveAttribute("href", "tel:+44 7700 900123");
  });
});
