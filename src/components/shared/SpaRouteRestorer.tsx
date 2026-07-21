"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SpaRouteRestorer() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const redirectPath = urlParams.get("p");

    if (redirectPath) {
      // Remove ?p= parameter from address bar cleanly
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState(null, "", cleanUrl);

      // Navigate to the target route (e.g., /movies/1368337/)
      router.replace(redirectPath);
    }
  }, [router]);

  return null;
}
