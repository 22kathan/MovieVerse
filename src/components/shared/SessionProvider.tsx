// ============================================
// MovieVerse — Session Provider Wrapper
// Provides auth session to client components
// ============================================

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

// Safe fetch wrapper to handle auth endpoints gracefully
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
    }

    try {
      const response = await originalFetch.apply(this, arguments as any);

      // Protect against ClientFetchError: Unexpected token '<' on /api/auth/session
      if (url.includes("/api/auth/session")) {
        const contentType = response.headers.get("content-type") || "";
        if (!response.ok || contentType.includes("text/html")) {
          return new Response(JSON.stringify(null), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      return response;
    } catch {
      if (url.includes("/api/auth/session")) {
        return new Response(JSON.stringify(null), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error("Network request failed");
    }
  };
}

export default function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider basePath="/api/auth">{children}</NextAuthSessionProvider>;
}
