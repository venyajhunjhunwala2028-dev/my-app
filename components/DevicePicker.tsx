"use client";

/** Large buttons asking which device the question is about. */
export default function DevicePicker({
  prompt,
  options,
  onChoose,
}: {
  prompt: string;
  options: string[];
  onChoose: (device: string) => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">{prompt}</h2>
      {options.map((option) => (
        <button key={option} type="button" className="btn-secondary" onClick={() => onChoose(option)}>
          {option}
        </button>
      ))}
    </section>
  );
}
