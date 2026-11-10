import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY, getUsage, setFamilyContact } from "@/lib/store/localStore";
import AskBox from "@/components/AskBox";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const stepsAnswer = {
  kind: "steps",
  language: "en",
  title: "Send a photo",
  device: null,
  steps: [{ instruction: "Open WhatsApp", lookFor: "Green icon", spoken: "Open WhatsApp" }],
  screenshotHowTo: ["Press the side button and volume up together"],
};

describe("WaitingAndErrors", () => {
  beforeEach(() => {
    push.mockReset();
    localStorage.setItem(STORAGE_KEY, "{}");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("double-tapping Ask sends one request, counts one use and shows Thinking", async () => {
    let finish: (r: Response) => void = () => {};
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (finish = resolve)));
    vi.stubGlobal("fetch", fetchMock);
    render(<AskBox />);
    await userEvent.type(screen.getByLabelText("What would you like to do?"), "How do I send a photo?");
    await userEvent.dblClick(screen.getByRole("button", { name: "Ask" }));

    expect(screen.getByText("Thinking, one moment…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask" })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getUsage().count).toBe(1);
    finish(new Response(JSON.stringify(stepsAnswer)));
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
  });

  it("a network failure shows Try again with the question still filled in", async () => {
    setFamilyContact({ name: "Priya", phone: "+44 7700 900123" });
    const fetchMock = vi.fn(async (): Promise<Response> => {
      throw new TypeError("Failed to fetch");
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AskBox />);
    await userEvent.type(screen.getByLabelText("What would you like to do?"), "How do I send a photo?");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByLabelText("What would you like to do?")).toHaveValue("How do I send a photo?");
    expect(screen.getByRole("link", { name: "Call" })).toBeInTheDocument();

    fetchMock.mockImplementation(async () => new Response(JSON.stringify(stepsAnswer)));
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(push).toHaveBeenCalled());
  });
});
