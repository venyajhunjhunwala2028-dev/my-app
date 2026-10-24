import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY, getFamilyCallMe, getFamilyContact, setFamilyContact } from "@/lib/store/localStore";
import CallFamily from "@/components/CallFamily";

describe("CallFamily", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEY, "{}");
  });

  it("opens the setup form when no contact is saved", () => {
    render(<CallFamily />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone number/)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("saves a contact, confirms it, then offers Call and WhatsApp links", async () => {
    const user = userEvent.setup();
    render(<CallFamily />);
    await user.type(screen.getByLabelText("Name"), "Priya");
    await user.type(screen.getByLabelText(/Phone number/), "+44 7700 900123");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(getFamilyContact()).toEqual({ name: "Priya", phone: "+44 7700 900123" });
    expect(screen.getByText("Is this right?")).toBeInTheDocument();
    expect(screen.getByText("Priya")).toBeInTheDocument();
    expect(screen.getByText("+44 7700 900123")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Yes" }));

    expect(screen.getByRole("heading", { name: "Call Priya" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Call/ })).toHaveAttribute("href", "tel:+44 7700 900123");
    expect(screen.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", "https://wa.me/447700900123");
  });

  it("replaces the saved number when the contact is changed", async () => {
    const user = userEvent.setup();
    setFamilyContact({ name: "Priya", phone: "+44 7700 900123" });
    render(<CallFamily />);
    await user.click(screen.getByRole("button", { name: "Change family contact" }));

    const phone = screen.getByLabelText(/Phone number/);
    expect(phone).toHaveValue("+44 7700 900123");
    await user.clear(phone);
    await user.type(phone, "+91 98765 43210");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: "Yes" }));

    expect(getFamilyContact()).toEqual({ name: "Priya", phone: "+91 98765 43210" });
    expect(screen.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", "https://wa.me/919876543210");
  });

  it("also asks what messages to family should call the learner, and saves it", async () => {
    const user = userEvent.setup();
    render(<CallFamily />);
    await user.type(screen.getByLabelText("Name"), "Priya");
    await user.type(screen.getByLabelText(/Phone number/), "+44 7700 900123");
    const callMe = screen.getByLabelText("What should messages to your family call you? (optional)");
    expect(callMe).toHaveAccessibleDescription("For example Mom, Dad, Nani, or your name.");
    await user.type(callMe, "Mom");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(getFamilyCallMe()).toBe("Mom");
  });

  it("left empty, the name counts as asked, so Ask my family does not ask again", async () => {
    const user = userEvent.setup();
    render(<CallFamily />);
    await user.type(screen.getByLabelText("Name"), "Priya");
    await user.type(screen.getByLabelText(/Phone number/), "+44 7700 900123");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(getFamilyCallMe()).toBe("");
  });

  describe("collapsed (Easy Mode home)", () => {
    it("keeps the setup form behind one button until it is wanted", async () => {
      render(<CallFamily collapsed />);
      expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Set up Call family" }));
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
    });

    it("shows the call button straight away once a contact is saved", () => {
      setFamilyContact({ name: "Priya", phone: "+44 7700 900123" });
      render(<CallFamily collapsed />);
      expect(screen.queryByRole("button", { name: "Set up Call family" })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Call/ })).toHaveAttribute("href", "tel:+44 7700 900123");
    });
  });
});
