"use client";

import { useEffect, useState, useRef } from "react";
import { Claim } from "@/types";
import { getClaimById, subscribeToClaim } from "@/lib/api/claims";
import { toast } from "sonner";

export function useLiveClaim(claimId: string) {
  const [claim, setClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const previousStatusRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Initial fetch
    getClaimById(claimId).then((initialClaim) => {
      if (isMounted) {
        setClaim(initialClaim);
        if (initialClaim) {
          previousStatusRef.current = initialClaim.currentStatus;
        }
        setIsLoading(false);
      }
    });

    // Subscribe to live change stream
    const unsubscribe = subscribeToClaim(claimId, (updatedClaim) => {
      if (!isMounted) return;

      // If status changed, notify the user with a calm toast
      if (previousStatusRef.current && previousStatusRef.current !== updatedClaim.currentStatus) {
        toast.info(`Claim #${updatedClaim.claimNumber} updated to ${updatedClaim.currentStatus}`, {
          description: "Live change stream update received.",
        });
      }
      previousStatusRef.current = updatedClaim.currentStatus;
      setClaim(updatedClaim);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [claimId]);

  return { claim, isLive: true, isLoading };
}
