"use client";

import { useRef, useState, type ChangeEvent } from "react";
import DevicePicker from "@/components/DevicePicker";
import SafetyNotice from "@/components/SafetyNotice";
import WaitingAndErrors, { type RequestError } from "@/components/WaitingAndErrors";
import type { Box, LocateAnswer } from "@/lib/ai/locate";
import { MAX_IMAGE_BYTES } from "@/lib/http/limits";
import { postJson } from "@/lib/http/postJson";
import { resizeScreenshot, type PreparedImage } from "@/lib/image/resize";
import { requestAllowance } from "@/lib/store/localStore";

const DEVICE_OPTIONS = ["iPhone", "Android phone", "iPad or tablet", "Windows computer", "Mac"];
const NOT_A_PICTURE = "That is not a picture. Please choose the screenshot you just took.";
const TOO_BIG = "That picture is too big. Please choose the screenshot you just took.";
const CANT_OPEN = "Sorry, that picture could not be opened. Please choose your screenshot again.";

type State =
  | { kind: "idle"; problem?: string }
  | { kind: "limit" }
  | { kind: "waiting" }
  | { kind: "error"; error: RequestError }
  | { kind: "answer"; answer: LocateAnswer };

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

/** The screenshot with a thick circle and arrow on the place to tap, positioned in percentages of the image. */
function MarkedScreenshot({ image, box }: { image: PreparedImage; box: Box }) {
  const [zoomed, setZoomed] = useState(false);
  const centreX = (box.x + box.width / 2) / image.width;
  const centreY = (box.y + box.height / 2) / image.height;
  // A little larger than the control, and never smaller than a fingertip.
  const diameter = (Math.max(box.width, box.height) * 1.4) / image.width;
  const arrowBelow = centreY < 0.25;
  return (
    <div className={zoomed ? "overflow-auto" : undefined}>
      <button
        type="button"
        onClick={() => setZoomed((z) => !z)}
        aria-label={zoomed ? "Make the picture smaller" : "Make the picture bigger"}
        className="relative block"
        style={{ width: zoomed ? "200%" : "100%" }}
      >
        {/* A data URL of the learner's own screenshot; next/image adds nothing here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:${image.mediaType};base64,${image.base64}`}
          alt="Your screenshot"
          className="block w-full rounded-2xl border-2 border-muted"
        />
        <span
          data-testid="tap-marker"
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: pct(centreX), top: pct(centreY), width: pct(diameter), minWidth: "4.5rem", aspectRatio: "1" }}
        >
          <span
            data-testid="tap-circle"
            className="absolute inset-0 rounded-full border-[6px] border-warning shadow-[0_0_0_3px_white]"
          />
          <span
            aria-hidden="true"
            className={`absolute left-1/2 -translate-x-1/2 text-6xl font-black leading-none text-warning [text-shadow:0_0_4px_white] ${
              arrowBelow ? "top-full" : "bottom-full"
            }`}
          >
            {arrowBelow ? "↑" : "↓"}
          </span>
        </span>
      </button>
      <p className="mt-2 text-lg text-muted">{zoomed ? "Tap the picture to make it smaller." : "Tap the picture to make it bigger."}</p>
    </div>
  );
}

export default function ShowMeOnScreen({
  instruction,
  lookFor,
  device,
  screenshotHowTo,
  language,
}: {
  instruction: string;
  lookFor?: string;
  device: string | null;
  screenshotHowTo: string[];
  language: string;
}) {
  const [chosenDevice, setChosenDevice] = useState(device);
  const [understood, setUnderstood] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [image, setImage] = useState<PreparedImage | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function send(prepared: PreparedImage) {
    setState({ kind: "waiting" });
    const result = await postJson<LocateAnswer>("/api/locate", {
      image: prepared.base64,
      mediaType: prepared.mediaType,
      width: prepared.width,
      height: prepared.height,
      instruction,
      lookFor,
      language,
    });
    if ("kind" in result) setState({ kind: "answer", answer: result });
    else setState({ kind: "error", error: result });
  }

  // Every send counts against today's cap, including Try again.
  function retry() {
    if (!image) return;
    if (!requestAllowance().allowed) return setState({ kind: "limit" });
    void send(image);
  }

  async function choose(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setState({ kind: "idle", problem: NOT_A_PICTURE });
    if (file.size > MAX_IMAGE_BYTES) return setState({ kind: "idle", problem: TOO_BIG });
    if (!requestAllowance().allowed) return setState({ kind: "limit" });

    let prepared: PreparedImage;
    try {
      prepared = await resizeScreenshot(file);
    } catch {
      return setState({ kind: "idle", problem: CANT_OPEN });
    }
    setImage(prepared);
    await send(prepared);
  }

  if (state.kind === "limit") return <SafetyNotice kind="daily_limit" />;

  if (state.kind === "answer") {
    const { answer } = state;
    if (answer.kind === "scam_warning") return <SafetyNotice kind="scam_warning" message={answer.message} />;
    if (answer.kind === "not_found") {
      return (
        <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
          <h2 className="text-2xl font-bold">I couldn&apos;t find it on your screen</h2>
          <p lang={language} className="text-xl">
            {answer.description}
          </p>
        </section>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        <p lang={language} className="text-2xl font-semibold">
          {answer.instruction}
        </p>
        {image && <MarkedScreenshot image={image} box={answer.box} />}
      </div>
    );
  }

  if (chosenDevice === null) {
    return <DevicePicker prompt="Which device are you using?" options={DEVICE_OPTIONS} onChoose={setChosenDevice} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">First, take a screenshot</h2>
        <p className="text-xl text-muted">A screenshot is a picture of your screen. Go to the screen you need help with, then:</p>
        <ol lang={language} className="flex list-decimal flex-col gap-2 pl-8 text-xl">
          {screenshotHowTo.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <p className="text-xl text-muted">Then come back to this app.</p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border-2 border-warning bg-warning-surface p-4">
        <p className="text-xl">
          Don&apos;t send screenshots of bank apps, passwords or private messages. This app doesn&apos;t save your
          screenshot; it&apos;s sent to an AI service to be read.
        </p>
        {understood ? (
          <p className="text-xl font-semibold">Thank you.</p>
        ) : (
          <button type="button" className="btn-secondary" onClick={() => setUnderstood(true)}>
            I understand
          </button>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <button
          type="button"
          className="btn-primary min-h-20 text-2xl"
          disabled={!understood || state.kind === "waiting"}
          onClick={() => input.current?.click()}
        >
          Choose your screenshot
        </button>
        <input
          ref={input}
          data-testid="screenshot-input"
          type="file"
          accept="image/*"
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
          disabled={!understood}
          onChange={(e) => void choose(e)}
        />
        <p className="text-xl text-muted">Pick the newest picture, the one you just took.</p>
        {state.kind === "idle" && state.problem && (
          <p role="alert" className="rounded-2xl border-2 border-warning bg-warning-surface p-4 text-xl">
            {state.problem}
          </p>
        )}
      </section>

      <WaitingAndErrors
        waiting={state.kind === "waiting"}
        error={state.kind === "error" ? state.error : null}
        onRetry={retry}
      />
    </div>
  );
}
