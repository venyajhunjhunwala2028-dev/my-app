import Wordmark from "@/components/brand/Wordmark";

/*
 * Mock Tech Helper screens for the phone mockups. Purely decorative: each sits inside a PhoneFrame whose
 * wrapper has role="img" and a description. Sizes are in em, relative to the phone's own font size,
 * so a screen scales with the phone.
 */

/** Hero: a guide on Step 2 of 4, "Tap the + button", with the magic lens around the + in a screenshot. */
export function StepScreen() {
  return (
    <div className="flex h-full flex-col gap-[0.9em] px-[1.3em] pt-[4.6em] pb-[2.6em] text-[#0a0a0a]">
      <div className="flex items-center justify-between">
        <Wordmark size="1em" />
        <span className="rounded-full bg-[#eeedfe] px-[0.8em] py-[0.35em] text-[0.85em] font-semibold text-[#3d33f0]">
          Step 2 of 4
        </span>
      </div>
      <div className="grid grid-cols-4 gap-[0.35em]">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-[0.3em] rounded-full ${i < 2 ? "bg-[#3d33f0]" : "bg-[#e5e5e5]"}`} />
        ))}
      </div>
      <div className="flex flex-col gap-[0.4em]">
        <p className="font-display text-[2.05em] leading-[1.02] font-semibold tracking-[-0.03em]">Tap the + button</p>
        <p className="text-[0.95em] leading-snug text-[#525252]">It&apos;s a small square with a + sign, at the bottom of the screen.</p>
      </div>

      {/* A screenshot of Instagram with the spot to tap ringed and the rest dimmed. */}
      <div className="relative flex-1 overflow-hidden rounded-[1.1em] border border-[#e5e5e5] bg-white">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-[0.9em] pt-[0.8em] pb-[0.5em]">
            <span className="text-[1em] font-bold italic">Instagram</span>
            <span className="flex gap-[0.35em]">
              <span className="h-[0.8em] w-[0.8em] rounded-full border-[0.15em] border-[#0a0a0a]" />
              <span className="h-[0.8em] w-[0.8em] rounded-[0.2em] border-[0.15em] border-[#0a0a0a]" />
            </span>
          </div>
          <div className="flex gap-[0.45em] px-[0.9em] pb-[0.6em]">
            {["#f5c54a", "#e7798f", "#8c86ff", "#2e8a50", "#f5c54a"].map((c, i) => (
              <span key={i} className="h-[1.9em] w-[1.9em] rounded-full border-[0.15em] border-white" style={{ background: c, boxShadow: "0 0 0 0.12em #e7798f" }} />
            ))}
          </div>
          <div className="flex-1 bg-gradient-to-br from-[#ffe2b8] via-[#f8c9d4] to-[#c9c5ff]" />
          <div className="flex items-center justify-around border-t border-[#e5e5e5] px-[0.6em] py-[0.7em]">
            <span className="h-[0.9em] w-[0.9em] rounded-[0.2em] border-[0.15em] border-[#0a0a0a]" />
            <span className="h-[0.9em] w-[0.9em] rounded-full border-[0.15em] border-[#0a0a0a]" />
            <span className="relative z-20 flex h-[1.3em] w-[1.3em] items-center justify-center rounded-[0.3em] border-[0.15em] border-[#0a0a0a] bg-white text-[1em] leading-none font-bold">
              +
              <span className="lens-ring absolute top-1/2 left-1/2 h-[2.9em] w-[2.9em] -translate-x-1/2 -translate-y-1/2" />
            </span>
            <span className="h-[0.9em] w-[0.9em] rounded-[0.2em] border-[0.15em] border-[#0a0a0a]" />
            <span className="h-[0.9em] w-[0.9em] rounded-full bg-[#d9d6fc]" />
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ background: "radial-gradient(circle at 50% calc(100% - 1.35em), transparent 1.7em, rgb(10 10 20 / 0.28) 1.9em)" }}
        />
      </div>

      <div className="flex flex-col gap-[0.5em]">
        <span className="flex h-[3.1em] items-center justify-center rounded-full bg-[#3d33f0] text-[1.05em] font-semibold text-white">
          ✓ I did it
        </span>
        <span className="flex h-[3.1em] items-center justify-center rounded-full border-[0.14em] border-[#0a0a0a] text-[1.05em] font-semibold">
          Show me where
        </span>
      </div>
    </div>
  );
}

/** Safety: a pasted message asking for an OTP, and Tech Helper's red verdict with the reason. */
export function ScamScreen() {
  return (
    <div className="flex h-full flex-col gap-[0.9em] bg-[#f4f4f1] px-[1.2em] pt-[4.6em] pb-[2.6em] text-[#0a0a0a]">
      <div className="flex items-center justify-between">
        <Wordmark size="1em" />
        <span className="text-[0.85em] font-semibold text-[#525252]">Scam check</span>
      </div>
      <p className="font-display text-[1.6em] leading-[1.05] font-semibold tracking-[-0.03em]">Is this message safe?</p>
      <div className="rounded-[1em] rounded-tl-[0.3em] bg-white p-[0.9em] text-[0.95em] leading-snug shadow-[0_0_0_1px_#e5e5e5]">
        <p className="mb-[0.3em] text-[0.8em] font-semibold text-[#525252]">VM-BANKKY · SMS</p>
        Dear customer, your account will be BLOCKED today. Share the OTP sent to you to keep it open.
      </div>
      <div className="flex flex-col gap-[0.55em] rounded-[1em] bg-[#fdeeec] p-[0.95em] text-[#a8261b]">
        <p className="text-[1.2em] leading-tight font-bold">🔴 Potential scam</p>
        <p className="text-[0.95em] leading-snug text-[#0a0a0a]">
          <span className="font-semibold">Why?</span> It asks for your OTP. Banks never ask you to share it.
        </p>
        <p className="text-[0.95em] leading-snug text-[#0a0a0a]">
          <span className="font-semibold">What to do:</span> Don&apos;t reply. Delete the message.
        </p>
      </div>
      <div className="flex flex-col gap-[0.5em]">
        <span className="flex h-[3.1em] items-center justify-center rounded-full bg-[#3d33f0] text-[1.05em] font-semibold text-white">
          Check another message
        </span>
      </div>
    </div>
  );
}

/** Families: the lock screen of the family helper's phone, with an "Ask my family" message. */
export function LockScreen() {
  return (
    <div className="relative flex h-full flex-col items-center bg-[radial-gradient(120%_70%_at_50%_0%,#5b52ff_0%,#3d33f0_45%,#1b148f_100%)] px-[1em] pt-[4.4em] pb-[2.6em] text-white">
      <svg viewBox="0 0 16 20" className="h-[1.5em] w-auto" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="9" width="12" height="10" rx="2.5" fill="currentColor" stroke="none" />
        <path d="M4.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
      </svg>
      <p className="mt-[0.6em] text-[1.05em] font-medium text-white/85">Tuesday 27 October</p>
      <p className="font-display text-[5.2em] leading-[1] font-semibold tracking-[-0.04em]">9:41</p>

      <div className="mt-auto w-full rounded-[1.4em] bg-white/85 p-[0.9em] text-[#0a0a0a] shadow-[0_10px_30px_-10px_rgb(0_0_40/0.5)] backdrop-blur">
        <div className="mb-[0.45em] flex items-center gap-[0.5em]">
          <span className="flex h-[1.7em] w-[1.7em] items-center justify-center rounded-[0.45em] bg-[#25d366] text-[0.95em] text-white">
            ✆
          </span>
          <span className="text-[0.9em] font-semibold">WhatsApp</span>
          <span className="ml-auto text-[0.8em] text-[#525252]">now</span>
        </div>
        <p className="text-[1em] font-semibold">Mom</p>
        <div className="mt-[0.2em] flex gap-[0.6em]">
          <p className="text-[0.92em] leading-snug">
            Mom is stuck while trying to post on Instagram.
            <br />
            Mom is on Step 2 of 4: Tap the + button.
            <br />
            <span className="text-[#525252]">Sent from Tech Helper</span>
          </p>
          <span className="relative h-[3.6em] w-[2.2em] shrink-0 overflow-hidden rounded-[0.4em] bg-gradient-to-b from-[#ffe2b8] to-[#c9c5ff] shadow-[0_0_0_1px_#e5e5e5]">
            <span className="absolute bottom-[0.35em] left-1/2 h-[0.7em] w-[0.7em] -translate-x-1/2 rounded-full border-[0.12em] border-[#3d33f0]" />
          </span>
        </div>
      </div>
      <div className="mt-[0.7em] flex w-full justify-between px-[0.6em]">
        <span className="flex h-[2.6em] w-[2.6em] items-center justify-center rounded-full bg-black/25 text-[1em]">🔦</span>
        <span className="flex h-[2.6em] w-[2.6em] items-center justify-center rounded-full bg-black/25 text-[1em]">📷</span>
      </div>
    </div>
  );
}
