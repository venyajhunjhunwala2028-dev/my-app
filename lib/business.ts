// The business behind Tech Helper, shown on the legal pages (/terms, /privacy, /refunds, /contact), the Plus page
// and the paywall. Razorpay checks these pages before it gives live keys.
//
// The owner's details, as registered with Razorpay (an individual account trading as Tech Helper).

export const BUSINESS = {
  /** The legal name of the business (or your own name, for an individual account). */
  name: "Venya Jhunjhunwala",
  /** The name customers' bank and UPI statements show for the ₹99 payment (with Razorpay, often your legal name). */
  statementName: "VENYA JHUNJHUNWALA",
  /** Where customers can write to you about payments, cancellations and refunds. */
  email: "venyajhunjhunwala06@gmail.com",
  /** A phone number customers can call or WhatsApp. */
  phone: "+91 89610 67953",
  /** Your postal address, as registered with Razorpay. */
  address: "Jhunjhunwala House, 140/4B NSC Bose Road, Tollygunge, Kolkata, West Bengal 700040, India",
  /** The city whose courts handle disputes (Terms). */
  jurisdiction: "Kolkata, India",
  /** How soon you reply to messages. */
  responseTime: "within 2 working days",
  /** How long an approved refund usually takes to reach the customer. Check this with Razorpay. */
  refundTime: "5–7 working days",
  /** When the legal pages were last changed. */
  lastUpdated: "11 November 2026",
} as const;

/** True for a value that still needs filling in. */
export const isPlaceholder = (value: string) => /^\[.*\]$|\[[^\]]+\]/.test(value);
