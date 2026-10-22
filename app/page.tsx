export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-bold">Tech Helper</h1>
      <form className="flex flex-col gap-4">
        <label htmlFor="question" className="text-xl">
          What do you need help with?
        </label>
        <textarea
          id="question"
          name="question"
          rows={3}
          className="rounded-2xl border-2 border-muted p-4 text-xl"
        />
        <button type="submit" className="btn-primary">
          Ask
        </button>
      </form>
    </main>
  );
}
