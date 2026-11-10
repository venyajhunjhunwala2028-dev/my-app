// Puts this phone on Tech Helper Plus for a test, as the server would after a payment.
import { getPlus, setPlus, type PlusRecord } from "@/lib/store/localStore";

export const TEST_SUBSCRIPTION = "sub_TESTPLUS000001";

export function givePlus(overrides: Partial<PlusRecord> = {}): PlusRecord {
  setPlus({
    subscriptionId: TEST_SUBSCRIPTION,
    token: "v1.test-token.signature",
    validUntil: Date.now() + 20 * 24 * 60 * 60 * 1000,
    checkedAt: Date.now(),
    status: "active",
    ...overrides,
  });
  return getPlus()!;
}
