"use client";

import { useId, useState, type FormEvent } from "react";
import { useT } from "@/lib/i18n";
import {
  CALL_ME_MAX,
  getFamilyCallMe,
  getFamilyContact,
  setFamilyCallMe,
  setFamilyContact,
  type FamilyContact,
} from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

type Mode = "auto" | "form" | "confirm";

export default function CallFamily({
  onSaved,
  collapsed = false,
  askCallMe = true,
}: {
  onSaved?: (contact: FamilyContact) => void;
  /** With no contact saved, show a "Set up Call family" button instead of the form (Easy Mode home). */
  collapsed?: boolean;
  /** Also ask what Ask my family messages should call the learner (off where that is asked separately). */
  askCallMe?: boolean;
} = {}) {
  // The store lives in localStorage, so read it only after the page is running in the browser.
  const isClient = useIsClient();
  const t = useT();
  const [mode, setMode] = useState<Mode>("auto");

  if (!isClient) return null;
  const contact = getFamilyContact();
  const view = mode === "auto" ? (contact ? "ready" : collapsed ? "closed" : "form") : mode;

  function save(next: FamilyContact, callMe: string | null) {
    setFamilyContact(next);
    if (callMe !== null) setFamilyCallMe(callMe);
    setMode("confirm");
    onSaved?.(next);
  }

  return (
    <section className="card flex flex-col gap-4">
      {view === "closed" && (
        <button type="button" className="btn-secondary min-h-[4.5rem] text-xl" onClick={() => setMode("form")}>
          <span aria-hidden="true" className="mr-2">
            📞
          </span>
          {t("family.setUp")}
        </button>
      )}
      {view === "form" && <ContactForm initial={contact} askCallMe={askCallMe} onSave={save} />}
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
          <h2 className="text-2xl font-bold">
            <span aria-hidden="true" className="mr-2">
              📞
            </span>
            {t("family.callName", { name: contact.name })}
          </h2>
          <div className="@container">
            <div className="grid grid-cols-1 gap-3 @[17rem]:grid-cols-2">
              <a href={`tel:${contact.phone}`} className="btn-primary">
                {t("family.call")}
              </a>
              <a href={`https://wa.me/${contact.phone.replace(/\D/g, "")}`} className="btn-secondary">
                {t("family.whatsapp")}
              </a>
            </div>
          </div>
          <button type="button" className="btn-text" onClick={() => setMode("form")}>
            {t("family.changeContact")}
          </button>
        </div>
      )}
    </section>
  );
}

function ContactForm({
  initial,
  askCallMe,
  onSave,
}: {
  initial: FamilyContact | null;
  askCallMe: boolean;
  /** `callMe` is null when it was not asked here. */
  onSave: (c: FamilyContact, callMe: string | null) => void;
}) {
  const t = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [callMe, setCallMe] = useState(() => getFamilyCallMe() ?? "");
  // Unique ids: the form can show twice on the home screen (there and in Ask my family).
  const id = useId();

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({ name: name.trim(), phone: phone.trim() }, askCallMe ? callMe : null);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <h2 className="text-2xl font-bold">
        <span aria-hidden="true" className="mr-2">
          📞
        </span>
        {t("family.who")}
      </h2>
      <label htmlFor={`${id}-name`} className="text-xl">
        {t("family.name")}
      </label>
      <input
        id={`${id}-name`}
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="field"
      />
      <label htmlFor={`${id}-phone`} className="text-xl">
        {t("family.phone")}
      </label>
      <input
        id={`${id}-phone`}
        type="tel"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="field"
      />
      {askCallMe && (
        <>
          <label htmlFor={`${id}-call-me`} className="text-xl">
            {t("family.callMe")}
          </label>
          <p id={`${id}-call-me-hint`} className="-mt-2 text-lg text-muted">
            {t("family.callMeHint")}
          </p>
          <input
            id={`${id}-call-me`}
            aria-describedby={`${id}-call-me-hint`}
            value={callMe}
            maxLength={CALL_ME_MAX}
            autoComplete="nickname"
            onChange={(e) => setCallMe(e.target.value)}
            className="field"
          />
        </>
      )}
      <button type="submit" className="btn-primary">
        {t("family.save")}
      </button>
    </form>
  );
}
