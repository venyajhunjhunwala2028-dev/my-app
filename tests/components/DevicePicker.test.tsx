import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY, getCurrentGuide, getDevices, setDevices } from "@/lib/store/localStore";
import AskBox from "@/components/AskBox";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("DevicePicker", () => {
  beforeEach(() => {
    push.mockReset();
    localStorage.setItem(STORAGE_KEY, "{}");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("covers AE7: asks which device, saves the choice as a usual device and asks again", async () => {
    setDevices(["Windows computer"]);
    const answers = [
      { kind: "needs_device", language: "en", prompt: "Which device are you using?", options: ["iPhone", "Android phone", "Windows computer"] },
      {
        kind: "steps",
        language: "en",
        title: "Make the text bigger",
        device: "iPhone",
        steps: [{ instruction: "Open Settings", lookFor: "Grey gear icon", spoken: "Open Settings" }],
        screenshotHowTo: ["Press the side button and volume up together"],
      },
    ];
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(answers.shift())));
    vi.stubGlobal("fetch", fetchMock);

    render(<AskBox />);
    await userEvent.type(screen.getByLabelText("What would you like to do?"), "How do I make the text bigger?");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));

    expect(await screen.findByText("Which device are you using?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Android phone" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "iPhone" }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(getDevices()).toEqual(["iPhone", "Windows computer"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const second = JSON.parse(String(((fetchMock.mock.calls[1] as unknown[])[1] as RequestInit).body));
    expect(second).toMatchObject({ question: "How do I make the text bigger?", devices: ["iPhone", "Windows computer"] });
    expect(getCurrentGuide()?.title).toBe("Make the text bigger");
  });
});
