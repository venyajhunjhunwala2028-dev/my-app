import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Bullets, ContactDetails, Part } from "@/components/legal/LegalPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Terms · Tech Helper" };

export default function TermsPage() {
  return (
    <LegalPage label="Terms" title="Terms of use">
      <p>
        These terms are between you and {BUSINESS.name} (“we”), who run Tech Helper. By using Tech Helper you agree to them.
      </p>
      <Part title="What Tech Helper is">
        <p>
          Tech Helper gives simple, step-by-step help with phones, computers, apps and AI. Its answers are written by an AI
          service. They are usually right, but can be wrong or out of date, and your screen may look different. Please check
          anything important, especially about money, banking or your accounts, and never share an OTP, PIN or password with
          anyone. Tech Helper is not connected to, or approved by, the makers of the apps and devices it helps with.
        </p>
      </Part>
      <Part title="Free and Plus">
        <p>
          The main helper is free, including asking questions, step-by-step guides, screenshot and camera help and the scam
          check. Tech Helper Plus adds lessons (“Teach me”), Practice and Ask my family.
        </p>
        <Bullets
          items={[
            "Plus costs ₹99 a month (Indian rupees). The amount shown at checkout is the amount charged each month.",
            "Plus is a subscription paid through Razorpay by UPI AutoPay or card. It renews every month until you cancel.",
            "You can cancel anytime on the Tech Helper Plus page (“Cancel my plan”) or by contacting us. No more payments are taken, and Plus stays on until the end of the month you have paid for.",
            "Plus is unlocked on your phone. Keep your restore code (it starts with sub_) to unlock it on a new phone.",
          ]}
        />
        <p>
          See{" "}
          <Link href="/refunds" className="underline underline-offset-4">
            Cancellations and refunds
          </Link>{" "}
          for refunds.
        </p>
      </Part>
      <Part title="Fair use">
        <p>
          Please use Tech Helper for its purpose: getting help with technology. Each phone can ask a limited number of questions a
          day, and we may limit or block use that harms the service or other people. Do not try to get around payments or limits.
        </p>
      </Part>
      <Part title="Our responsibility">
        <p>
          We provide Tech Helper as it is and work to keep it running, but cannot promise it will always be available or free of
          mistakes. As far as the law allows, we are not responsible for loss caused by following its answers; our total
          responsibility to you is limited to what you paid us for Plus in the last three months. Nothing in these terms takes
          away rights you have under Indian consumer law.
        </p>
      </Part>
      <Part title="Changes, law and contact">
        <p>
          We may update these terms; the date above shows when. If we change the price of Plus, we will tell you in the app before
          it applies, and you can cancel. These terms are governed by the laws of India, and the courts of {BUSINESS.jurisdiction}{" "}
          handle any dispute.
        </p>
        <ContactDetails />
      </Part>
    </LegalPage>
  );
}
