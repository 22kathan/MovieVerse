export const dynamic = "force-static";
// ============================================
// MovieVerse — Auth API Route Handler
// Handles all NextAuth.js auth routes
// ============================================

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

export function generateStaticParams() { return [{ nextauth: ["session"] }]; }
