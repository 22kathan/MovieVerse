export const dynamic = "force-static";
// ============================================
// MovieVerse — Custom Lists API
// GET: Fetch user's lists
// POST: Create a new list
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createListSchema = z.object({
  name: z.string().min(1, "List name is required").max(100),
  description: z.string().optional(),
  isPublic: z.boolean().optional().default(true),
});

import { isDatabaseOffline } from "@/lib/prisma";

// GET /api/lists
export async function GET(request: Request) {
  try {
    if (await isDatabaseOffline()) {
      return NextResponse.json({ lists: [] });
    }

    const session = await auth();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const publicOnly = searchParams.get("public") === "true";

    const where: any = {};

    if (userId) {
      where.userId = userId;
      if (!session?.user?.id || session.user.id !== userId) {
        where.isPublic = true; // Only show public lists for other users
      }
    } else if (session?.user?.id) {
      where.userId = session.user.id;
    } else {
      where.isPublic = true;
    }

    if (publicOnly) where.isPublic = true;

    const lists = await prisma.userList.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, image: true, username: true } },
        items: {
          include: {
            movie: {
              select: { id: true, tmdbId: true, title: true, posterPath: true, voteAverage: true },
            },
          },
          orderBy: { sortOrder: "asc" },
          take: 4, // Preview items
        },
        _count: { select: { items: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ lists });
  } catch (error) {
    console.warn("GET /api/lists database offline (using empty fallback):", error);
    return NextResponse.json({ lists: [] });
  }
}

// POST /api/lists
export async function POST(request: Request) {
  try {
    if (await isDatabaseOffline()) {
      return NextResponse.json(
        { error: "Database offline. This action is temporarily disabled." },
        { status: 503 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const data = createListSchema.parse(body);

    // Generate slug from name
    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.userList.findFirst({
      where: { userId: session.user.id, slug },
    })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const list = await prisma.userList.create({
      data: {
        userId: session.user.id,
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
        slug,
      },
      include: {
        user: { select: { id: true, name: true, username: true } },
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/lists error:", error);
    return NextResponse.json({ error: "Failed to create list" }, { status: 500 });
  }
}
