// The business behind Tech Helper, shown on the legal pages (/terms, /privacy, /refunds, /contact), the Plus page
// and the paywall. Razorpay checks these pages before it gives live keys.
//
// OWNER: replace every "[...]" value below with your real details before applying for Razorpay live keys.
// Nothing here is a real person's or company's details: they are placeholders.

export const BUSINESS = {
  /** The legal name of the business (or your own name, for an individual account). */
  name: "[Your business name]",
  /** The name customers' bank and UPI statements show for the ₹99 payment (with Razorpay, often your legal name). */
  statementName: "[Name shown on bank statements]",
  /** Where customers can write to you about payments, cancellations and refunds. */
  email: "[your-email@example.com]",
  /** A phone number customers can call or WhatsApp. */
  phone: "[Your phone number]",
  /** Your postal address, as registered with Razorpay. */
  address: "[Your address, city, state, PIN code, India]",
  /** The city whose courts handle disputes (Terms). */
  jurisdiction: "[Your city], India",
  /** How soon you reply to messages. */
  responseTime: "within 2 working days",
  /** How long an approved refund usually takes to reach the customer. Check this with Razorpay. */
  refundTime: "5–7 working days",
  /** When the legal pages were last changed. */
  lastUpdated: "[Date you publish these pages]",
} as const;

/** True for a value that still needs filling in. */
export const isPlaceholder = (value: string) => /^\[.*\]$|\[[^\]]+\]/.test(value);
