// ============================================
// MovieVerse — Session Provider Wrapper
// Provides auth session to client components
// ============================================

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

// Intercept global fetch for static export compatibility
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    const isStaticDeployment =
      window.location.hostname.includes("github.io") ||
      window.location.port === "8000" ||
      process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

    if (isStaticDeployment) {
      if (url.includes("/api/auth/session")) {
        const mockSession = localStorage.getItem("movieverse_mock_session");
        if (mockSession) {
          return new Response(mockSession, {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify(null), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/api/auth/csrf")) {
        return new Response(JSON.stringify({ csrfToken: "mock-csrf-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/api/auth/signout")) {
        localStorage.removeItem("movieverse_mock_session");
        // Redirect to homepage for static site
        setTimeout(() => {
          window.location.href = "/portfolio/movieverse/";
        }, 100);
        return new Response(JSON.stringify({ url: "/portfolio/movieverse/" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return originalFetch.apply(this, arguments as any);
  };
}

export default function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
