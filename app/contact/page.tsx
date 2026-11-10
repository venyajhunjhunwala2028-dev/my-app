import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { ContactDetails, Part } from "@/components/legal/LegalPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Contact us · Tech Helper" };

export default function ContactPage() {
  return (
    <LegalPage label="Contact" title="Contact us">
      <p>Questions about Tech Helper, a payment, cancelling or a refund? We’re happy to help. We reply {BUSINESS.responseTime}.</p>
      <ContactDetails />
      <Part title="About payments">
        <p>
          Tech Helper Plus payments are handled by Razorpay. On your bank or UPI statement the payment shows as{" "}
          {BUSINESS.statementName} (Tech Helper). If you write about a payment, please include its date and your restore code
          (it starts with sub_). Never send us your card number, UPI PIN, OTP or password.
        </p>
        <p>
          You can cancel Plus yourself anytime on the{" "}
          <Link href="/app/plus" className="underline underline-offset-4">
            Tech Helper Plus page
          </Link>
          .
        </p>
      </Part>
    </LegalPage>
  );
}
