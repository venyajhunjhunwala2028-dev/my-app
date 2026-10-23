import { describe, expect, it } from "vitest";
import { applyScamFloor, scamPrecheck } from "@/lib/safety/scamPrecheck";
import type { ScamAnswer } from "@/lib/ai/scam";

describe("scamPrecheck", () => {
  it("flags requests to share an OTP, PIN, password or CVV as scam", () => {
    expect(scamPrecheck("Dear customer, share the OTP with our executive to continue")?.floor).toBe("scam");
    expect(scamPrecheck("Please send your ATM PIN and CVV to verify")?.floor).toBe("scam");
    expect(scamPrecheck("OTP bata do jaldi")?.floor).toBe("scam");
  });

  it("does not flag a normal bank OTP message that says not to share it", () => {
    expect(scamPrecheck("123456 is your OTP for login. Do not share it with anyone.")).toBeNull();
    expect(scamPrecheck("Never share your PIN with anyone.")).toBeNull();
  });

  it("flags KYC with a link, lottery, collect requests and remote apps as scam", () => {
    expect(scamPrecheck("Your KYC update is pending. Click https://kyc-sbi.co/x now")?.floor).toBe("scam");
    expect(scamPrecheck("Congratulations! You won the lottery of Rs 25,00,000")?.floor).toBe("scam");
    expect(scamPrecheck("You have received a UPI collect request. Enter PIN to receive money")?.floor).toBe("scam");
    expect(scamPrecheck("Install AnyDesk so our agent can help")?.floor).toBe("scam");
    expect(scamPrecheck("आपका खाता बंद हो जाएगा, KYC के लिए लिंक https://x.in खोलें")?.floor).toBe("scam");
  });

  it("flags account-blocked threats and short links as careful", () => {
    expect(scamPrecheck("Your account will be blocked today")?.floor).toBe("careful");
    expect(scamPrecheck("Look at this bit.ly/3abc")?.floor).toBe("careful");
  });

  it("lets ordinary messages through", () => {
    expect(scamPrecheck("Hi Ma, I'll come for dinner on Sunday.")).toBeNull();
  });

  it("returns 1-3 plain reasons", () => {
    const hit = scamPrecheck("URGENT: account blocked. Share OTP. You won a lottery. bit.ly/x");
    expect(hit?.reasons.length).toBeGreaterThanOrEqual(1);
    expect(hit?.reasons.length).toBeLessThanOrEqual(3);
  });
});

describe("applyScamFloor", () => {
  const safe: ScamAnswer = { kind: "scam_check", verdict: "safe", reasons: ["Looks normal."], advice: "Fine.", language: "en" };

  it("raises a safe verdict to the floor and explains why", () => {
    const floored = applyScamFloor(safe, scamPrecheck("share the OTP with us"));
    expect(floored.verdict).toBe("scam");
    expect(floored.reasons[0]).toMatch(/OTP/);
    expect(floored.reasons.length).toBeLessThanOrEqual(3);
    expect(floored.advice).not.toBe("Fine.");
  });

  it("never lowers a verdict", () => {
    const scam: ScamAnswer = { ...safe, verdict: "scam", reasons: ["Bad."], advice: "Stop." };
    expect(applyScamFloor(scam, scamPrecheck("bit.ly/x"))).toEqual(scam);
    expect(applyScamFloor(safe, null)).toEqual(safe);
  });
});
