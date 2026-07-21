export const dynamic = "force-static";
// ============================================
// MovieVerse — User Registration API
// POST /api/auth/register
// ============================================

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma, isDatabaseOffline } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

import { findUserByEmail, findUserByUsername, createUser } from "@/lib/dbFallback";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = registerSchema.parse(body);

    let existing;
    let isDbOffline = await isDatabaseOffline();
    if (isDbOffline) {
      existing = findUserByEmail(email);
    } else {
      try {
        existing = await prisma.user.findUnique({
          where: { email },
        });
      } catch (dbError) {
        console.warn("Postgres offline during registration lookup, using local fallback:", dbError);
        isDbOffline = true;
        existing = findUserByEmail(email);
      }
    }

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate username from email
    const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    let username = baseUsername;
    let counter = 1;

    if (isDbOffline) {
      while (findUserByUsername(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      const user = createUser({
        name,
        email,
        hashedPassword,
        username,
        role: "REGISTERED",
      });

      return NextResponse.json(
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
          },
        },
        { status: 201 }
      );
    }

    // DB Online Path
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Create user in Postgres
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        username,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
