import type { Metadata } from "next";
import LegalPage, { Bullets, ContactDetails, Part } from "@/components/legal/LegalPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Cancellations and refunds · Tech Helper" };

export default function RefundsPage() {
  return (
    <LegalPage label="Refunds" title="Cancellations and refunds">
      <p>This policy is for Tech Helper Plus, ₹99 a month. The main helper is free and has nothing to refund.</p>
      <Part title="Cancel anytime">
        <Bullets
          items={[
            "Open Tech Helper, go to Settings → Tech Helper Plus (or the Plus page) and tap “Cancel my plan”. You can also cancel your UPI AutoPay mandate in your UPI app, or contact us and we will cancel it for you.",
            "After you cancel, no more payments are taken.",
            "Plus stays on until the end of the month you have already paid for. Then lessons, practice and Ask my family lock again; everything free keeps working.",
          ]}
        />
      </Part>
      <Part title="Refunds">
        <Bullets
          items={[
            "Payments are for a month at a time. We do not give partial refunds for the unused part of a month, except where the law requires it.",
            "If you were charged by mistake (for example twice for the same month, or after you cancelled), contact us with the date and amount and we will refund that charge.",
            `Approved refunds go back to the original payment method through Razorpay. They usually reach you within ${BUSINESS.refundTime}, depending on your bank.`,
          ]}
        />
      </Part>
      <Part title="How to contact us">
        <p>Please include the date of the payment and your restore code (it starts with sub_). We reply {BUSINESS.responseTime}.</p>
        <ContactDetails />
      </Part>
    </LegalPage>
  );
}
