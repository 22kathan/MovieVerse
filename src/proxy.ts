// ============================================
// MovieVerse — Route Protection Proxy (Next.js 16+)
// Replaces deprecated middleware.ts
// ============================================

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip internal auth API routes to prevent recursion or state conflicts
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = await auth();

  // Routes that require authentication
  const protectedPaths = ["/watchlist", "/lists", "/reviews", "/settings", "/activity"];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  // Admin routes
  const isAdmin = pathname.startsWith("/admin");

  if (isProtected && !session) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAdmin) {
    if (!session) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    if ((session.user as any)?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
