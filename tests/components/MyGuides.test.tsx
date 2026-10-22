import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY, getCurrentGuide, getGuideStep, saveGuide, setGuideStep } from "@/lib/store/localStore";
import MyGuides from "@/components/MyGuides";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("MyGuides", () => {
  beforeEach(() => {
    push.mockReset();
    localStorage.setItem(STORAGE_KEY, "{}");
  });

  it("shows each saved guide as a button and reopens one at step 1", async () => {
    saveGuide({ id: "photo", question: "How do I send a photo?", title: "Send a photo", answer: {} });
    saveGuide({ id: "call", question: "How do I make a video call?", title: "Make a video call", answer: {} });
    setGuideStep("photo", 3);

    render(<MyGuides />);
    expect(screen.getByRole("button", { name: "Make a video call" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Send a photo" }));

    expect(getGuideStep("photo")).toBe(1);
    expect(getCurrentGuide()?.id).toBe("photo");
    expect(push).toHaveBeenCalledWith("/guide/photo");
  });

  it("shows a friendly hint when nothing is saved", () => {
    render(<MyGuides />);
    expect(screen.getByText("Guides you use will appear here so you can do them again.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
