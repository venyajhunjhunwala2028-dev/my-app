"use client";

import { useState, type ReactNode } from "react";
import PlusOffer from "@/components/billing/PlusOffer";
import PlusUnlocked from "@/components/billing/PlusUnlocked";
import { usePlus } from "@/lib/billing/plus";

/**
 * Wraps a Plus feature (lessons, practice): with Plus it shows the feature; without, a calm paywall in its place.
 * Unlocking here shows "You're all set!" with the restore code, then the feature. Nothing shows until the phone's
 * saved state is read, so a Plus learner never sees the paywall flash.
 */
export default function PlusGate({
  children,
  headingLevel = 1,
  frame = (view) => view,
}: {
  children: ReactNode;
  headingLevel?: 1 | 2;
  /** Wraps the paywall and the unlocked screen (not the feature), e.g. in the page's own layout. */
  frame?: (view: ReactNode) => ReactNode;
}) {
  const { isPlus, status } = usePlus();
  const [unlockedCode, setUnlockedCode] = useState<string | null>(null);
  if (status === "loading") return null;
  if (unlockedCode) {
    return frame(<PlusUnlocked code={unlockedCode} headingLevel={headingLevel} onContinue={() => setUnlockedCode(null)} />);
  }
  if (isPlus) return <>{children}</>;
  return frame(<PlusOffer headingLevel={headingLevel} onUnlocked={(grant) => setUnlockedCode(grant.subscriptionId)} />);
}
