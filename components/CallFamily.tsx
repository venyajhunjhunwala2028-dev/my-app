"use client";

import { useState, type FormEvent } from "react";
import { useT } from "@/lib/i18n";
import { getFamilyContact, setFamilyContact, type FamilyContact } from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

type Mode = "auto" | "form" | "confirm";

export default function CallFamily() {
  // The store lives in localStorage, so read it only after the page is running in the browser.
  const isClient = useIsClient();
  const t = useT();
  const [mode, setMode] = useState<Mode>("auto");

  if (!isClient) return null;
  const contact = getFamilyContact();
  const view = mode === "auto" ? (contact ? "ready" : "form") : mode;

  function save(next: FamilyContact) {
    setFamilyContact(next);
    setMode("confirm");
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
      {view === "form" && <ContactForm initial={contact} onSave={save} />}
      {view === "confirm" && contact && (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">{t("family.isRight")}</h2>
          <p className="text-2xl font-semibold">{contact.name}</p>
          <p className="text-2xl">{contact.phone}</p>
          <button type="button" className="btn-primary" onClick={() => setMode("auto")}>
            {t("common.yes")}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setMode("form")}>
            {t("family.change")}
          </button>
        </div>
      )}
      {view === "ready" && contact && (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">{t("family.callName", { name: contact.name })}</h2>
          <a href={`tel:${contact.phone}`} className="btn-primary">
            {t("family.call")}
          </a>
          <a href={`https://wa.me/${contact.phone.replace(/\D/g, "")}`} className="btn-secondary">
            {t("family.whatsapp")}
          </a>
          <button type="button" className="btn-text" onClick={() => setMode("form")}>
            {t("family.changeContact")}
          </button>
        </div>
      )}
    </section>
  );
}

function ContactForm({ initial, onSave }: { initial: FamilyContact | null; onSave: (c: FamilyContact) => void }) {
  const t = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({ name: name.trim(), phone: phone.trim() });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <h2 className="text-2xl font-bold">{t("family.who")}</h2>
      <label htmlFor="family-name" className="text-xl">
        {t("family.name")}
      </label>
      <input
        id="family-name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-2xl border-2 border-muted bg-background p-4 text-xl"
      />
      <label htmlFor="family-phone" className="text-xl">
        {t("family.phone")}
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
        {t("family.save")}
      </button>
    </form>
  );
}
