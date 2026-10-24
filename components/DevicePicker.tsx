"use client";

/** Large buttons asking which device the question is about. */
export default function DevicePicker({
  prompt,
  options,
  label = (option) => option,
  onChoose,
}: {
  prompt: string;
  options: string[];
  /** The words to show for an option; the option itself is what is chosen. */
  label?: (option: string) => string;
  onChoose: (device: string) => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">{prompt}</h2>
      {options.map((option) => (
        <button key={option} type="button" className="btn-secondary" onClick={() => onChoose(option)}>
          {label(option)}
        </button>
      ))}
    </section>
  );
}
