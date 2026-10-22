import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShowMeOnScreen from "@/components/ShowMeOnScreen";
import { requestAllowance } from "@/lib/store/localStore";

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

beforeEach(() => answerWith({ kind: "not_found", description: "unused" }));
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

  it("rejects a file that is not a picture with a friendly message", async () => {
    render(<ShowMeOnScreen {...props} />);
    await chooseScreenshot(new File(["hello"], "notes.txt", { type: "text/plain" }));
    expect(screen.getByText(/not a picture/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a picture over 4 MB with a friendly message", async () => {
    render(<ShowMeOnScreen {...props} />);
    await chooseScreenshot(png(4 * 1024 * 1024 + 1));
    expect(screen.getByText(/too big/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("at 30 uses today, shows the ready-tomorrow message and sends nothing", async () => {
    for (let i = 0; i < 30; i++) requestAllowance();
    render(<ShowMeOnScreen {...props} />);
    await chooseScreenshot();
    expect(screen.getByText(/ready again tomorrow/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
