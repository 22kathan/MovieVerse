import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, isDatabaseOffline } from "@/lib/prisma";
import { z } from "zod";

const addItemSchema = z.object({
  tmdbId: z.number().int().positive(),
  movieTitle: z.string(),
  posterPath: z.string().nullable().optional(),
  mediaType: z.enum(["MOVIE", "TV_SHOW"]).optional().default("MOVIE"),
});

export async function POST(
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
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }

    const { id: listId } = await params;
    const body = await request.json();
    const data = addItemSchema.parse(body);

    const list = await prisma.userList.findUnique({ where: { id: listId } });
    if (!list || list.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    let movie = await prisma.movie.findUnique({ where: { tmdbId: data.tmdbId } });
    if (!movie) {
      movie = await prisma.movie.create({
        data: { tmdbId: data.tmdbId, title: data.movieTitle, posterPath: data.posterPath, mediaType: data.mediaType },
      });
    }

    const existing = await prisma.listItem.findUnique({
      where: { listId_movieId: { listId, movieId: movie.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already in list" }, { status: 409 });
    }

    const maxOrder = await prisma.listItem.aggregate({ where: { listId }, _max: { sortOrder: true } });

    const item = await prisma.listItem.create({
      data: { listId, movieId: movie.id, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
      include: { movie: { select: { id: true, tmdbId: true, title: true, posterPath: true } } },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
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
    if (!session?.user?.id) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { id: listId } = await params;
    const { searchParams } = new URL(request.url);
    const tmdbId = searchParams.get("tmdbId");
    if (!tmdbId) return NextResponse.json({ error: "tmdbId required" }, { status: 400 });

    const list = await prisma.userList.findUnique({ where: { id: listId } });
    if (!list || list.userId !== session.user.id) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const movie = await prisma.movie.findUnique({ where: { tmdbId: parseInt(tmdbId) } });
    if (!movie) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.listItem.deleteMany({ where: { listId, movieId: movie.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
  }
}
