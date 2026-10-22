"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { getFamilyContact, setFamilyContact, type FamilyContact } from "@/lib/store/localStore";

const noSubscribe = () => () => {};

// The store lives in localStorage, so read it only after the page is running in the browser.
function useIsClient(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}

type Mode = "auto" | "form" | "confirm";

export default function CallFamily() {
  const isClient = useIsClient();
  const [mode, setMode] = useState<Mode>("auto");
  const [, setVersion] = useState(0);

  if (!isClient) return null;
  const contact = getFamilyContact();
  const view = mode === "auto" ? (contact ? "ready" : "form") : mode;

  function save(next: FamilyContact) {
    setFamilyContact(next);
    setVersion((v) => v + 1);
    setMode("confirm");
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
      {view === "form" && <ContactForm initial={contact} onSave={save} />}
      {view === "confirm" && contact && (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Is this right?</h2>
          <p className="text-2xl font-semibold">{contact.name}</p>
          <p className="text-2xl">{contact.phone}</p>
          <button type="button" className="btn-primary" onClick={() => setMode("auto")}>
            Yes
          </button>
          <button type="button" className="btn-secondary" onClick={() => setMode("form")}>
            Change
          </button>
        </div>
      )}
      {view === "ready" && contact && (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Call {contact.name}</h2>
          <a href={`tel:${contact.phone}`} className="btn-primary">
            Call
          </a>
          <a href={`https://wa.me/${contact.phone.replace(/\D/g, "")}`} className="btn-secondary">
            WhatsApp
          </a>
          <button type="button" className="btn-text" onClick={() => setMode("form")}>
            Change family contact
          </button>
        </div>
      )}
    </section>
  );
}

function ContactForm({ initial, onSave }: { initial: FamilyContact | null; onSave: (c: FamilyContact) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({ name: name.trim(), phone: phone.trim() });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <h2 className="text-2xl font-bold">Who should we call for help?</h2>
      <label htmlFor="family-name" className="text-xl">
        Name
      </label>
      <input
        id="family-name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-2xl border-2 border-muted bg-background p-4 text-xl"
      />
      <label htmlFor="family-phone" className="text-xl">
        Phone number (with country code, like +44)
      </label>
      <input
        id="family-phone"
        type="tel"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="rounded-2xl border-2 border-muted bg-background p-4 text-xl"
      />
      <button type="submit" className="btn-primary">
        Save
      </button>
    </form>
  );
}
