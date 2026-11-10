import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Bullets, ContactDetails, Part } from "@/components/legal/LegalPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Privacy · Tech Helper" };

export default function PrivacyPage() {
  return (
    <LegalPage label="Privacy" title="Privacy policy">
      <p>
        Tech Helper is run by {BUSINESS.name}. It has no accounts and no database: we do not keep a record of who you are or
        what you ask. This page explains exactly what happens to your information.
      </p>
      <Part title="Your questions, screenshots and photos">
        <p>
          When you ask a question, send a screenshot (“What do I press?”, “Check my screen”), use camera help or check a
          message for scams, it is sent through our server to Anthropic’s AI service (Claude) so it can be answered. We do not
          store it on our servers. Anthropic keeps what it receives through its API for a limited time under its own policies.
        </p>
        <p>
          The app reminds you not to send bank, password or private-message screens, or photos of bank cards, passwords or
          documents. Please never send an OTP, PIN or password: Tech Helper will never ask for one.
        </p>
      </Part>
      <Part title="What stays on your phone">
        <p>These are kept only in your phone’s browser storage, and never sent to us:</p>
        <Bullets
          items={[
            "your recent and saved guides, lessons and practice progress",
            "your settings (language, text size, Easy Mode, voice, your devices)",
            "your family contact for Call my family, and the name Ask my family messages call you",
            "a count of today’s questions, for the daily limit",
            "for Tech Helper Plus: your subscription id (your restore code), an unlock code from our server and its end date",
          ]}
        />
        <p>Clearing your browser’s data for this site removes them.</p>
      </Part>
      <Part title="Payments for Tech Helper Plus">
        <p>
          Payments are handled by Razorpay. You enter your UPI or card details in Razorpay’s own checkout, not in our app, and we
          never see or store them. Razorpay processes your payment details under its own privacy policy.
        </p>
        <p>
          To check that Plus is paid for, our server asks Razorpay about your subscription using its id. We do not keep a copy:
          your phone keeps the subscription id, and we ask Razorpay again when needed.
        </p>
      </Part>
      <Part title="Ask my family, voice and hosting">
        <Bullets
          items={[
            "Ask my family messages are sent by you, from your own phone, through WhatsApp, text message or your phone’s share sheet. Pictures are never uploaded to us.",
            "Speaking to the app uses your browser’s own speech recognition, which your browser’s maker (for example Google or Apple) may process on its servers.",
            "The site is hosted on Vercel. Like any website host, it handles your web requests and may keep standard technical logs (such as IP addresses) for security and to limit how many requests one device can make. Our own error logs contain short error codes only, never your questions, pictures, keys or ids.",
            "We use no advertising, no tracking cookies and no analytics.",
          ]}
        />
      </Part>
      <Part title="Children">
        <p>Tech Helper is meant for adults. It is not directed at children under 18.</p>
      </Part>
      <Part title="Changes and contact">
        <p>
          If this policy changes, we will update this page and its date. Questions about privacy? Write to us, or see{" "}
          <Link href="/contact" className="underline underline-offset-4">
            Contact us
          </Link>
          .
        </p>
        <ContactDetails />
      </Part>
    </LegalPage>
  );
}
