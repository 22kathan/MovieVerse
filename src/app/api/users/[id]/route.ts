import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findUserById, updateUser } from "@/lib/dbFallback";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true, name: true, email: true, image: true, username: true,
          bio: true, role: true, country: true, isPremium: true, createdAt: true,
          _count: { select: { reviews: true, watchlist: true, lists: true, ratings: true, followers: true, following: true } },
        },
      });
    } catch (dbError) {
      console.warn("Postgres offline during user GET, using local fallback:", dbError);
      const fallbackUser = findUserById(id);
      if (fallbackUser) {
        user = {
          ...fallbackUser,
          image: null,
          bio: fallbackUser.bio || "",
          country: fallbackUser.country || "US",
          createdAt: fallbackUser.createdAt,
          _count: { reviews: 0, watchlist: 0, lists: 0, ratings: 0, followers: 0, following: 0 },
        };
      } else {
        user = null;
      }
    }

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Hide email for non-owner
    const session = await auth();
    const isOwner = session?.user?.id === id;
    if (!isOwner) {
      return NextResponse.json({ user: { ...user, email: undefined } });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { id } = await params;
    if (session.user.id !== id) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const body = await request.json();
    const allowedFields = ["name", "username", "bio", "country", "language", "darkMode"];
    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    let user;
    try {
      if (updateData.username) {
        const existing = await prisma.user.findFirst({
          where: { username: updateData.username, NOT: { id } },
        });
        if (existing) return NextResponse.json({ error: "Username taken" }, { status: 409 });
      }

      user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, name: true, email: true, image: true, username: true, bio: true, role: true },
      });
    } catch (dbError) {
      console.warn("Postgres offline during user PUT, using local fallback:", dbError);
      
      if (updateData.username) {
        const allUsers = require("@/lib/dbFallback").getUsers();
        const usernameTaken = allUsers.some(
          (u: any) => u.username?.toLowerCase() === updateData.username.toLowerCase() && u.id !== id
        );
        if (usernameTaken) return NextResponse.json({ error: "Username taken" }, { status: 409 });
      }

      const fallbackUser = updateUser(id, updateData);
      if (fallbackUser) {
        user = {
          id: fallbackUser.id,
          name: fallbackUser.name,
          email: fallbackUser.email,
          image: null,
          username: fallbackUser.username,
          bio: fallbackUser.bio || "",
          role: fallbackUser.role,
        };
      } else {
        return NextResponse.json({ error: "User not found in fallback" }, { status: 404 });
      }
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
