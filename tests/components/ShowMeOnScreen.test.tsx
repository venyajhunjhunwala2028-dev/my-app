import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShowMeOnScreen from "@/components/ShowMeOnScreen";
import { resizeScreenshot } from "@/lib/image/resize";
import { STORAGE_KEY, getUsage, requestAllowance } from "@/lib/store/localStore";

// jsdom cannot decode or draw images, so the resize step is replaced.
vi.mock("@/lib/image/resize", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/image/resize")>()),
  resizeScreenshot: vi.fn(async () => ({ base64: "AAAA", mediaType: "image/jpeg", width: 1179, height: 2556 })),
}));

const props = {
  instruction: "Tap Share.",
  lookFor: "The Share button at the bottom.",
  device: "iPhone" as string | null,
  screenshotHowTo: ["Press the side button and volume up together."],
  language: "en",
};

let fetchMock: ReturnType<typeof vi.fn>;
function answerWith(body: unknown) {
  fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
}

const png = (bytes = 10) => new File([new Uint8Array(bytes)], "shot.png", { type: "image/png" });
const user = () => userEvent.setup({ applyAccept: false });

async function chooseScreenshot(file = png()) {
  const u = user();
  await u.click(screen.getByRole("button", { name: "I understand" }));
  await u.upload(screen.getByTestId("screenshot-input"), file);
}

beforeEach(() => {
  localStorage.setItem(STORAGE_KEY, "{}");
  vi.mocked(resizeScreenshot).mockClear();
  answerWith({ kind: "not_found", description: "unused" });
});
afterEach(() => vi.unstubAllGlobals());

describe("ShowMeOnScreen", () => {
  it("shows how to take a screenshot and the privacy reminder before the choose button is enabled", async () => {
    render(<ShowMeOnScreen {...props} />);
    expect(screen.getByText("Press the side button and volume up together.")).toBeInTheDocument();
    expect(screen.getByText(/Don't send screenshots of bank apps, passwords or private messages/)).toBeInTheDocument();
    const choose = screen.getByRole("button", { name: "Choose your screenshot" });
    expect(choose).toBeDisabled();
    await user().click(screen.getByRole("button", { name: "I understand" }));
    expect(choose).toBeEnabled();
    expect(screen.getByText("Pick the newest picture, the one you just took.")).toBeInTheDocument();
  });

  it("covers AE5: a not_found answer shows the description and draws no circle", async () => {
    answerWith({ kind: "not_found", description: "Look for a paper plane at the bottom right." });
    render(<ShowMeOnScreen {...props} />);
    await chooseScreenshot();
    expect(await screen.findByText("Look for a paper plane at the bottom right.")).toBeInTheDocument();
    expect(screen.getByText(/couldn't find it/i)).toBeInTheDocument();
    expect(screen.queryByTestId("tap-circle")).not.toBeInTheDocument();
  });

  it("places the circle by percentages of the image, so it matches at any display size", async () => {
    answerWith({
      kind: "found",
      box: { x: 560, y: 2270, width: 60, height: 60 }, // centred on (590, 2300)
      instruction: "Tap the Share button inside the red circle.",
    });
    render(<ShowMeOnScreen {...props} />);
    await chooseScreenshot();
    const marker = await screen.findByTestId("tap-marker");
    expect(marker.style.left).toBe("50.04%");
    expect(marker.style.top).toBe("89.98%");
    expect(screen.getByTestId("tap-circle")).toBeInTheDocument();
    expect(screen.getByText("Tap the Share button inside the red circle.")).toBeInTheDocument();

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toEqual({
      image: "AAAA",
      mediaType: "image/jpeg",
      width: 1179,
      height: 2556,
      instruction: "Tap Share.",
      lookFor: "The Share button at the bottom.",
      language: "en",
    });
  });

  it("shows SafetyNotice and no circle for a scam_warning answer", async () => {
    answerWith({ kind: "scam_warning", message: "This screen is asking for a code. Do not type it." });
    render(<ShowMeOnScreen {...props} />);
    await chooseScreenshot();
    expect(await screen.findByText("This screen is asking for a code. Do not type it.")).toBeInTheDocument();
    expect(screen.getByText("Stop — this looks like a scam")).toBeInTheDocument();
    expect(screen.queryByTestId("tap-circle")).not.toBeInTheDocument();
  });

  it("shows the money refusal and no circle for a money_refusal answer", async () => {
    answerWith({ kind: "money_refusal", message: "I can't help with sending money or payments." });
    render(<ShowMeOnScreen {...props} />);
    await chooseScreenshot();
    expect(await screen.findByText("I can't help with sending money or payments.")).toBeInTheDocument();
    expect(screen.getByText("I can't help with sending money")).toBeInTheDocument();
    expect(screen.queryByTestId("tap-circle")).not.toBeInTheDocument();
  });

  it("gives the use back when the request fails, and counts Try again only when it answers", async () => {
    fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: "retry", message: "Sorry, something went wrong. Please try again." }), { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ShowMeOnScreen {...props} />);
    await chooseScreenshot();
    expect(await screen.findByText("Sorry, something went wrong. Please try again.")).toBeInTheDocument();
    expect(getUsage().count).toBe(0);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ kind: "not_found", description: "Look at the bottom." })));
    await user().click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Look at the bottom.")).toBeInTheDocument();
    expect(getUsage().count).toBe(1);
  });

  it("rejects a file that is not a picture with a friendly message", async () => {
    render(<ShowMeOnScreen {...props} />);
    await chooseScreenshot(new File(["hello"], "notes.txt", { type: "text/plain" }));
    expect(screen.getByText(/not a picture/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a picture too big to open (over 25 MB) with a friendly message", async () => {
    render(<ShowMeOnScreen {...props} />);
    await chooseScreenshot(png(25 * 1024 * 1024 + 1));
    expect(screen.getByText(/too big/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(resizeScreenshot).not.toHaveBeenCalled();
    expect(getUsage().count).toBe(0);
  });

  it("sends a large photo that shrinks under 3 MB once resized", async () => {
    render(<ShowMeOnScreen {...props} />);
    await chooseScreenshot(png(5 * 1024 * 1024));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(getUsage().count).toBe(1);
  });

  it("rejects a picture still over 3 MB after resizing, without spending a use", async () => {
    vi.mocked(resizeScreenshot).mockResolvedValueOnce({
      base64: "A".repeat(4 * 1024 * 1024 + 4), // decodes to 3 MB + 3 bytes
      mediaType: "image/jpeg",
      width: 1179,
      height: 2556,
    });
    render(<ShowMeOnScreen {...props} />);
    await chooseScreenshot();
    expect(await screen.findByText(/too big/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getUsage().count).toBe(0);
  });

  it("does not spend a use when the picture cannot be opened", async () => {
    vi.mocked(resizeScreenshot).mockRejectedValueOnce(new Error("decode"));
    render(<ShowMeOnScreen {...props} />);
    await chooseScreenshot();
    expect(await screen.findByText(/could not be opened/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getUsage().count).toBe(0);
  });

  it("at 30 uses today, shows the ready-tomorrow message and sends nothing", async () => {
    for (let i = 0; i < 30; i++) requestAllowance();
    render(<ShowMeOnScreen {...props} />);
    await chooseScreenshot();
    expect(screen.getByText(/ready again tomorrow/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the ready-tomorrow message when the server rate-limits the request (HTTP 429)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Too Many Requests", { status: 429 })));
    render(<ShowMeOnScreen {...props} />);
    await chooseScreenshot();
    expect(await screen.findByText(/ready again tomorrow/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });
});
