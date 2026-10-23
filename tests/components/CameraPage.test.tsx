import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CameraPage from "@/app/app/camera/page";
import { fakeCameraAnswer } from "@/lib/ai/camera";
import { resizeScreenshot } from "@/lib/image/resize";
import { STORAGE_KEY, getCurrentGuide, getUsage, requestAllowance, setDevices } from "@/lib/store/localStore";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
// jsdom cannot decode or draw images, so the resize step is replaced.
vi.mock("@/lib/image/resize", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/image/resize")>()),
  resizeScreenshot: vi.fn(async () => ({ base64: "CCCC", mediaType: "image/jpeg", width: 1000, height: 800 })),
}));

const photo = { image: "CCCC", mediaType: "image/jpeg" as const, width: 1000, height: 800 };
let fetchMock: ReturnType<typeof vi.fn>;
function answerWith(body: unknown) {
  fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
}
const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body as string);
const user = () => userEvent.setup({ applyAccept: false });
const jpg = () => new File([new Uint8Array(10)], "router.jpg", { type: "image/jpeg" });

async function takePhoto(u = user()) {
  await u.click(screen.getByRole("button", { name: "I understand" }));
  await u.upload(screen.getByTestId("camera-input"), jpg());
}

beforeEach(() => {
  localStorage.setItem(STORAGE_KEY, "{}");
  push.mockReset();
  vi.mocked(resizeScreenshot).mockClear();
  answerWith(fakeCameraAnswer({ ...photo, question: "What does this light mean?" }));
});
afterEach(() => vi.unstubAllGlobals());

describe("Show me with my camera page", () => {
  it("has a heading, a way home, and the privacy reminder before a photo can be taken or chosen", async () => {
    render(<CameraPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Show me with my camera" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/app");
    expect(screen.getByText(/Don't take photos of bank cards, passwords or documents/)).toBeInTheDocument();
    const take = screen.getByRole("button", { name: "Take a photo" });
    const choose = screen.getByRole("button", { name: "Choose a photo" });
    expect(take).toBeDisabled();
    expect(choose).toBeDisabled();
    await user().click(screen.getByRole("button", { name: "I understand" }));
    expect(take).toBeEnabled();
    expect(choose).toBeEnabled();
  });

  it("opens the back camera for Take a photo, and the normal picker for Choose a photo", () => {
    render(<CameraPage />);
    for (const id of ["camera-input", "camera-file-input"]) expect(screen.getByTestId(id)).toHaveAttribute("accept", "image/*");
    expect(screen.getByTestId("camera-input")).toHaveAttribute("capture", "environment");
    expect(screen.getByTestId("camera-file-input")).not.toHaveAttribute("capture");
  });

  it("sends the photo and the optional question, then explains it and circles the light", async () => {
    setDevices(["Android phone"]);
    render(<CameraPage />);
    const u = user();
    await takePhoto(u);
    expect(screen.getByRole("img", { name: "Your photo" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    await u.type(screen.getByLabelText("What would you like to know?"), "What does this light mean?");
    await u.click(screen.getByRole("button", { name: "Tell me about it" }));

    expect(await screen.findByRole("heading", { name: /This is a Wi-Fi router/ })).toBeInTheDocument();
    expect(screen.getByText(/The red light on the right means/)).toBeInTheDocument();
    expect(screen.getByText("Tech Helper found it")).toBeInTheDocument();
    expect(screen.getByTestId("tap-circle")).toBeInTheDocument();
    expect(screen.getByTestId("tap-arrow")).toHaveTextContent(/Look here\./);
    expect(sentBody()).toMatchObject({ ...photo, question: "What does this light mean?", devices: ["Android phone"] });
    expect(getUsage().count).toBe(1);
    // The photo is never saved.
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain("CCCC");
  });

  it("starts the steps in the normal step player", async () => {
    render(<CameraPage />);
    const u = user();
    await takePhoto(u);
    await u.click(screen.getByRole("button", { name: "Tell me about it" }));
    await u.click(await screen.findByRole("button", { name: "Show me what to do, step by step" }));
    expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/guide\//));
    const guide = getCurrentGuide();
    expect(guide).toMatchObject({ title: "Restart your router", answer: { kind: "steps", title: "Restart your router" } });
    expect((guide?.answer as { steps: unknown[] }).steps).toHaveLength(3);
    expect(sentBody().question).toBeUndefined();
  });

  it("offers no steps when there is nothing to do", async () => {
    answerWith(fakeCameraAnswer({ ...photo, question: "explain" }));
    render(<CameraPage />);
    const u = user();
    await takePhoto(u);
    await u.click(screen.getByRole("button", { name: "Tell me about it" }));
    await screen.findByRole("heading", { name: /This is a Wi-Fi router/ });
    expect(screen.queryByRole("button", { name: "Show me what to do, step by step" })).not.toBeInTheDocument();
  });

  it("asks to delete a photo of a card or document, and can take another", async () => {
    answerWith(fakeCameraAnswer({ ...photo, question: "card" }));
    render(<CameraPage />);
    const u = user();
    await takePhoto(u);
    await u.click(screen.getByRole("button", { name: "Tell me about it" }));
    expect(await screen.findByRole("heading", { name: "Please don't send this photo" })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Take another photo" }));
    expect(screen.getByRole("button", { name: "Take a photo" })).toBeInTheDocument();
  });

  it("at 30 uses today, says ready tomorrow and sends nothing", async () => {
    for (let i = 0; i < 30; i++) requestAllowance();
    render(<CameraPage />);
    const u = user();
    await takePhoto(u);
    await u.click(screen.getByRole("button", { name: "Tell me about it" }));
    await waitFor(() => expect(screen.getByText(/ready again tomorrow/i)).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
