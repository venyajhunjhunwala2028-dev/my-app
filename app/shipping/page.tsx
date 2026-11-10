import type { Metadata } from "next";
import LegalPage, { Bullets, ContactDetails, Part } from "@/components/legal/LegalPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Shipping and delivery · Tech Helper" };

export default function ShippingPage() {
  return (
    <LegalPage label="Delivery" title="Shipping and delivery">
      <p>Tech Helper is an online service. Nothing is shipped: there are no physical goods and no delivery charges.</p>
      <Part title="How Tech Helper Plus is delivered">
        <Bullets
          items={[
            "Plus is unlocked in the Tech Helper app on your phone as soon as your ₹99 payment is confirmed, usually within a minute.",
            "You see “You're all set! Plus is unlocked.” and a restore code. Keep the code to unlock Plus on a new phone.",
            "If Plus does not unlock after you have paid, open the Plus page and tap “I already have Plus”, or contact us with the date of the payment.",
          ]}
        />
      </Part>
      <Part title="How to contact us">
        <p>We reply {BUSINESS.responseTime}.</p>
        <ContactDetails />
      </Part>
    </LegalPage>
  );
}
