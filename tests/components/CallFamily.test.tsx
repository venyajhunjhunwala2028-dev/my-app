import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY, getFamilyContact, setFamilyContact } from "@/lib/store/localStore";
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
});
