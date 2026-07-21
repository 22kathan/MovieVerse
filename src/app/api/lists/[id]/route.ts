export const dynamic = "force-static";
// ============================================
// MovieVerse — Single List API
// GET: Fetch a single list with all items
// PUT: Update list details
// DELETE: Delete a list
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, isDatabaseOffline } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (await isDatabaseOffline()) {
      return NextResponse.json({ error: "List not found (Database offline)" }, { status: 404 });
    }
    const { id } = await params;

    const list = await prisma.userList.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true, username: true } },
        items: {
          include: {
            movie: {
              select: {
                id: true,
                tmdbId: true,
                title: true,
                posterPath: true,
                mediaType: true,
                releaseDate: true,
                voteAverage: true,
                avgUserRating: true,
                overview: true,
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { items: true } },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Privacy check
    if (!list.isPublic) {
      const session = await auth();
      if (!session?.user?.id || session.user.id !== list.userId) {
        return NextResponse.json({ error: "This list is private" }, { status: 403 });
      }
    }

    return NextResponse.json({ list });
  } catch (error) {
    console.error("GET /api/lists/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch list" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.userList.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const list = await prisma.userList.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        description: body.description ?? existing.description,
        isPublic: body.isPublic ?? existing.isPublic,
      },
    });

    return NextResponse.json({ list });
  } catch (error) {
    console.error("PUT /api/lists/[id] error:", error);
    return NextResponse.json({ error: "Failed to update list" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const existing = await prisma.userList.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.userList.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/lists/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete list" }, { status: 500 });
  }
}

export function generateStaticParams() { return [{ id: "1" }]; }
