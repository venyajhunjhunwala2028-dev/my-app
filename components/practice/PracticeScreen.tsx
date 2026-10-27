"use client";

import type { CSSProperties, ReactNode } from "react";
import type { PracticeElement, PracticeLook, PracticeTap } from "@/lib/content/practice";
import { useT, useUiLanguage, type UiLanguage } from "@/lib/i18n";

/** Colours for each pretend app: plain and generic, never a real app's brand. */
const LOOKS: Record<PracticeLook, { bar: string; barText: string; page: string; mine: string; accent: string }> = {
  chat: { bar: "#11706a", barText: "#ffffff", page: "#f1ede6", mine: "#d6f0e2", accent: "#11706a" },
  social: { bar: "#ffffff", barText: "#1c1b2e", page: "#ffffff", mine: "#eeecfb", accent: "#c2417a" },
  inbox: { bar: "#3730a3", barText: "#ffffff", page: "#faf9f6", mine: "#eeecfb", accent: "#3730a3" },
};

// The right place, after two wrong taps: a thick ring that also pulses (the pulse stops under reduced motion).
const REVEAL = "outline-4 outline-offset-2 outline-[#6d64f0] animate-pulse-ring relative z-10";

/** One tappable thing: a real button, named by its label. */
function Tap({
  tap,
  name,
  glowing,
  onTap,
  className,
  style,
  children,
}: {
  tap: PracticeTap;
  name: string;
  glowing: boolean;
  onTap: (id: string) => void;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={name}
      data-practice-target={tap.id}
      data-reveal={glowing ? "true" : undefined}
      className={`cursor-pointer transition-transform active:scale-95 ${className} ${glowing ? REVEAL : ""}`}
      style={style}
      onClick={() => onTap(tap.id)}
    >
      {children}
    </button>
  );
}

/**
 * A pretend phone screen built from plain parts (a top bar, a chat list, a photo grid…). Every tappable thing is a
 * real button with a name, so it works with a keyboard and a screen reader; `reveal` makes one glow.
 */
export default function PracticeScreen({
  screen,
  look,
  reveal,
  onTap,
}: {
  screen: readonly PracticeElement[];
  look: PracticeLook;
  /** The id of the right place to tap, once it should glow. */
  reveal?: string | null;
  onTap: (id: string) => void;
}) {
  const t = useT();
  const language = useUiLanguage();
  const colours = LOOKS[look];
  const text = (l: Record<UiLanguage, string>) => l[language];

  // Every tappable thing goes through here, so each is a named button and the right one can glow.
  const tapProps = (tap: PracticeTap) => ({ tap, name: text(tap.label), glowing: reveal === tap.id, onTap });

  const icon = (symbol?: string) => (
    <span aria-hidden="true" className="leading-none">
      {symbol}
    </span>
  );

  function element(el: PracticeElement, i: number): ReactNode {
    switch (el.kind) {
      case "appBar":
        return (
          <div key={i} className="flex items-center gap-1 px-2 pt-10 pb-2" style={{ background: colours.bar, color: colours.barText }}>
            {el.back && (
              <Tap {...tapProps(el.back)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-bold">
                {icon(el.back.icon)}
              </Tap>
            )}
            <p className={`min-w-0 flex-1 truncate text-lg font-bold ${el.back ? "" : "pl-2"}`}>{text(el.title)}</p>
            {el.actions?.map((a) =>
              a.text ? (
                <Tap key={a.id} {...tapProps(a)} className="flex h-11 shrink-0 items-center rounded-full px-3 text-base font-extrabold text-[#2563eb]">
                  {text(a.text)}
                </Tap>
              ) : (
                <Tap key={a.id} {...tapProps(a)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl">
                  {icon(a.icon)}
                </Tap>
              ),
            )}
          </div>
        );
      case "chatList":
        return (
          <ul key={i} className="flex flex-col bg-white">
            {el.chats.map((c) => (
              <li key={c.id} className="border-b border-[#ecebf3]">
                <Tap {...tapProps(c)} className="flex min-h-[4rem] w-full items-center gap-3 px-3 py-2 text-left">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ background: c.tone }}
                  >
                    {c.text ? text(c.text).slice(0, 1) : c.icon}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-base font-bold text-[#1c1b2e]">{c.text && text(c.text)}</span>
                      <span className="shrink-0 text-xs text-[#5c5a70]">{c.time}</span>
                    </span>
                    <span className="truncate text-sm text-[#5c5a70]">{text(c.preview)}</span>
                  </span>
                </Tap>
              </li>
            ))}
          </ul>
        );
      case "messages":
        return (
          <div key={i} className="flex flex-1 flex-col justify-end gap-2 px-3 py-3" style={{ background: colours.page }}>
            {el.messages.map((m, j) => (
              <p
                key={j}
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm text-[#1c1b2e] shadow-sm ${
                  m.from === "me" ? "self-end rounded-br-sm" : "self-start rounded-bl-sm bg-white"
                }`}
                style={m.from === "me" ? { background: colours.mine } : undefined}
              >
                {text(m.text)}
              </p>
            ))}
          </div>
        );
      case "composer":
        return (
          <div key={i} className="flex items-center gap-1 px-1.5 py-2" style={{ background: colours.page }}>
            <div className="flex min-w-0 flex-1 items-center gap-0.5 rounded-full bg-white py-0.5 pr-0.5 pl-1 shadow-sm">
              {el.tools.slice(0, 1).map((tool) => (
                <Tap key={tool.id} {...tapProps(tool)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl">
                  {icon(tool.icon)}
                </Tap>
              ))}
              <span className="min-w-0 flex-1 truncate text-sm text-[#5c5a70]">{text(el.placeholder)}</span>
              {el.tools.slice(1, -1).map((tool) => (
                <Tap key={tool.id} {...tapProps(tool)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl">
                  {icon(tool.icon)}
                </Tap>
              ))}
            </div>
            {el.tools.slice(-1).map((tool) => (
              <Tap
                key={tool.id}
                {...tapProps(tool)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-white"
              >
                <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: colours.accent }}>
                  {tool.icon}
                </span>
              </Tap>
            ))}
          </div>
        );
      case "sheet":
        return (
          <div key={i} className="flex flex-1 flex-col justify-end bg-[#1c1b2e]/35">
            <div className="rounded-t-3xl bg-white px-3 pt-3 pb-4 shadow-raised">
              <p className="pb-2 text-center text-sm font-bold text-[#5c5a70]">{text(el.title)}</p>
              <div className="grid grid-cols-3 gap-1">
                {el.options.map((o) => (
                  <Tap key={o.id} {...tapProps(o)} className="flex min-h-[5rem] flex-col items-center justify-center gap-1 rounded-2xl p-1">
                    <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eeecfb] text-2xl">
                      {o.icon}
                    </span>
                    <span className="text-xs font-semibold text-[#1c1b2e]">{text(o.label)}</span>
                  </Tap>
                ))}
              </div>
            </div>
          </div>
        );
      case "photoGrid":
        return (
          <div key={i} className="grid flex-1 grid-cols-3 content-start gap-1 bg-white p-1">
            {el.photos.map((p) => (
              <Tap key={p.id} {...tapProps(p)} className="flex aspect-square w-full items-center justify-center rounded-md text-4xl">
                <span aria-hidden="true" className="flex h-full w-full items-center justify-center rounded-md" style={{ background: p.tone }}>
                  {p.icon}
                </span>
              </Tap>
            ))}
          </div>
        );
      case "photo":
        return el.small ? (
          <div key={i} className="flex bg-white px-3 pt-3">
            <span aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-lg text-4xl" style={{ background: el.tone }}>
              {el.icon}
            </span>
          </div>
        ) : (
          <div key={i} aria-hidden="true" className="flex min-h-[10rem] flex-1 items-center justify-center text-7xl" style={{ background: el.tone }}>
            {el.icon}
          </div>
        );
      case "post":
        return (
          <div key={i} className="flex flex-1 flex-col bg-white">
            <p className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-[#1c1b2e]">
              <span aria-hidden="true" className="h-7 w-7 rounded-full" style={{ background: colours.accent }} />
              {text(el.author)}
            </p>
            <div aria-hidden="true" className="flex min-h-[9rem] flex-1 items-center justify-center text-6xl" style={{ background: el.tone }}>
              {el.icon}
            </div>
            <p aria-hidden="true" className="px-3 py-2 text-lg text-[#1c1b2e]">
              ♡ 💬
            </p>
          </div>
        );
      case "caption":
        return (
          <p key={i} className="border-b border-[#ecebf3] bg-white px-3 py-3 text-sm text-[#5c5a70]">
            {text(el.placeholder)}
          </p>
        );
      case "options":
        return (
          <ul key={i} className="flex flex-1 flex-col bg-white">
            {el.options.map((o) => (
              <li key={o.id} className="border-b border-[#ecebf3]">
                <Tap {...tapProps(o)} className="flex min-h-[3.25rem] w-full items-center gap-3 px-3 text-left text-base text-[#1c1b2e]">
                  {icon(o.icon)}
                  <span>{text(o.label)}</span>
                </Tap>
              </li>
            ))}
          </ul>
        );
      case "actions":
        return (
          <div
            key={i}
            className={`flex gap-3 bg-white px-3 py-3 ${el.align === "end" ? "justify-end" : "justify-center"}`}
          >
            {el.buttons.map((b) =>
              b.text ? (
                <Tap
                  key={b.id}
                  {...tapProps(b)}
                  className={`flex h-12 min-w-[6rem] items-center justify-center rounded-full px-5 text-base font-bold ${
                    b.tone ? "text-white" : "border-2 border-[#dcd9ec] text-[#1c1b2e]"
                  }`}
                  style={b.tone ? { background: b.tone } : undefined}
                >
                  {text(b.text)}
                </Tap>
              ) : (
                <Tap key={b.id} {...tapProps(b)} className="flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white">
                  <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: b.tone }}>
                    {b.icon}
                  </span>
                </Tap>
              ),
            )}
          </div>
        );
      case "call":
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-3 bg-[#1c1b2e] px-4 pt-14 pb-6 text-white">
            <span aria-hidden="true" className="flex h-24 w-24 items-center justify-center rounded-full bg-[#7c74ff] text-4xl font-bold">
              {text(el.name).slice(0, 1)}
            </span>
            <p className="text-2xl font-bold">{text(el.name)}</p>
            <p className="text-base text-white/80">{text(el.status)}</p>
            <div className="mt-auto flex items-center justify-center gap-5">
              {el.buttons.map((b) => (
                <Tap key={b.id} {...tapProps(b)} className="flex h-16 w-16 items-center justify-center rounded-full text-2xl">
                  <span
                    aria-hidden="true"
                    className="flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ background: b.tone ?? "rgb(255 255 255 / 0.18)" }}
                  >
                    {b.icon}
                  </span>
                </Tap>
              ))}
            </div>
          </div>
        );
      case "inbox":
        return (
          <ul key={i} className="flex flex-1 flex-col bg-white">
            {el.messages.map((m) => (
              <li key={m.id} className="border-b border-[#ecebf3]">
                <Tap {...tapProps(m)} className="flex w-full items-start gap-3 px-3 py-3 text-left">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                    style={{ background: m.tone }}
                  >
                    {text(m.sender).slice(0, 1)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-base font-bold text-[#1c1b2e]">{text(m.sender)}</span>
                      <span className="shrink-0 text-xs text-[#5c5a70]">{m.time}</span>
                    </span>
                    <span className="text-sm leading-snug text-[#3f3d52]">{text(m.preview)}</span>
                  </span>
                </Tap>
              </li>
            ))}
          </ul>
        );
      case "tabBar":
        return (
          <div key={i} className="mt-auto flex justify-around border-t border-[#ecebf3] bg-white pt-1 pb-4">
            {el.tabs.map((tab) => (
              <Tap key={tab.id} {...tapProps(tab)} className="flex h-14 min-w-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1">
                <span aria-hidden="true" className="text-xl leading-none text-[#1c1b2e]">
                  {tab.icon}
                </span>
                <span aria-hidden="true" className="text-[0.65rem] font-semibold text-[#5c5a70]">
                  {text(tab.label)}
                </span>
              </Tap>
            ))}
          </div>
        );
    }
  }

  return (
    <section aria-label={t("practice.screenLabel")} className="mx-auto w-[19rem] max-w-full">
      {/* The same realistic phone as the landing page: a near-black body, side buttons, a Dynamic Island. */}
      <div className="relative rounded-[2.75rem] bg-[#0b0b10] p-[0.55rem] shadow-[0_0_0_1.5px_#3a3a46,0_0_0_3px_#0b0b10,0_40px_80px_-20px_rgb(5_3_60/0.55),0_18px_36px_-18px_rgb(0_0_0/0.5)]">
        <span aria-hidden="true" className="absolute top-[17%] -left-[0.3rem] h-[4%] w-[0.3rem] rounded-l-sm bg-[#2a2a33]" />
        <span aria-hidden="true" className="absolute top-[25%] -left-[0.3rem] h-[7.5%] w-[0.3rem] rounded-l-sm bg-[#2a2a33]" />
        <span aria-hidden="true" className="absolute top-[27%] -right-[0.3rem] h-[11%] w-[0.3rem] rounded-r-sm bg-[#2a2a33]" />
        <div
          data-testid="practice-screen"
          className="relative flex min-h-[30rem] flex-col overflow-hidden rounded-[2.2rem]"
          style={{ background: colours.page }}
        >
          <div aria-hidden="true" className="absolute top-2 left-1/2 z-30 h-[1.35rem] w-[5.25rem] -translate-x-1/2 rounded-full bg-black" />
          {screen.map(element)}
          <div aria-hidden="true" className="pointer-events-none absolute bottom-1.5 left-1/2 z-30 h-1 w-24 -translate-x-1/2 rounded-full bg-black/80" />
        </div>
      </div>
    </section>
  );
}
