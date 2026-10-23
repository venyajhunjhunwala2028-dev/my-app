"use client";

const DEFAULT_MESSAGE =
  "Don't send screenshots of bank apps, passwords or private messages. This app doesn't save your screenshot; it's sent to an AI service to be read.";

/** Shown before any screenshot is chosen; the learner taps I understand to go on. */
export default function PrivacyReminder({
  understood,
  onUnderstand,
  message = DEFAULT_MESSAGE,
}: {
  understood: boolean;
  onUnderstand: () => void;
  message?: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border-2 border-warning bg-warning-surface p-4">
      <p className="text-xl">{message}</p>
      {understood ? (
        <p className="text-xl font-semibold">Thank you.</p>
      ) : (
        <button type="button" className="btn-secondary" onClick={onUnderstand}>
          I understand
        </button>
      )}
    </section>
  );
}
