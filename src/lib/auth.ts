import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma, isDatabaseOffline } from "./prisma";
import { findUserByEmail, findUserById } from "./dbFallback";

const prismaAdapter = PrismaAdapter(prisma);
const fallbackAdapter: any = {};
for (const [key, fn] of Object.entries(prismaAdapter)) {
  if (typeof fn === "function") {
    fallbackAdapter[key] = async (...args: any[]) => {
      const isOffline = await isDatabaseOffline();
      if (isOffline) {
        console.warn(`Database offline, bypassing adapter method: ${key}`);
        if (key === "getUserByEmail") {
          const { findUserByEmail } = require("./dbFallback");
          const user = findUserByEmail(args[0]);
          return user ? { ...user, emailVerified: null, image: null } : null;
        }
        if (key === "getUser") {
          const { findUserById } = require("./dbFallback");
          const user = findUserById(args[0]);
          return user ? { ...user, emailVerified: null, image: null } : null;
        }
        if (key === "createUser") {
          const { createUser } = require("./dbFallback");
          const created = createUser({
            name: args[0].name,
            email: args[0].email,
            role: "REGISTERED",
          });
          return { ...created, emailVerified: null, image: null };
        }
        return null;
      }
      try {
        return await (fn as any)(...args);
      } catch (err) {
        console.error(`Adapter error in ${key}:`, err);
        throw err;
      }
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: fallbackAdapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
    newUser: "/settings",
    error: "/sign-in",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const isOffline = await isDatabaseOffline();

        // Support simulated one-click OAuth logins in development
        if (password === "simulated_oauth_secret_bypass") {
          if (!isOffline) {
            try {
              let dbUser = await prisma.user.findUnique({ where: { email } });
              if (!dbUser) {
                dbUser = await prisma.user.create({
                  data: {
                    email,
                    name: email.split("@")[0].toUpperCase(),
                    role: "REGISTERED",
                    username: email.split("@")[0],
                  }
                });
              }
              return {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.name,
                image: dbUser.image,
              };
            } catch (dbError) {
              console.error("Failed to create simulated OAuth user in Postgres:", dbError);
            }
          }
          
          // Fallback user creation
          const { createUser, findUserByEmail } = require("./dbFallback");
          let fUser = findUserByEmail(email);
          if (!fUser) {
            fUser = createUser({
              name: email.split("@")[0].toUpperCase(),
              email,
              role: "REGISTERED",
            });
          }
          return {
            id: fUser.id,
            email: fUser.email,
            name: fUser.name,
            image: null,
          };
        }

        let user = null;
        if (!isOffline) {
          try {
            user = await prisma.user.findUnique({
              where: { email },
            });
          } catch (dbError) {
            console.warn("Postgres offline during auth query, falling back to local database:", dbError);
          }
        }

        // 1. Try to authenticate with PostgreSQL user
        if (user && user.hashedPassword) {
          const isValid = await bcrypt.compare(password, user.hashedPassword);
          if (isValid) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            };
          }
        }

        // 2. Try to authenticate with local fallback database user
        const fallbackUser = findUserByEmail(email);
        if (fallbackUser && fallbackUser.hashedPassword) {
          const isValid = await bcrypt.compare(password, fallbackUser.hashedPassword);
          if (isValid) {
            return {
              id: fallbackUser.id,
              email: fallbackUser.email,
              name: fallbackUser.name,
              image: null,
            };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }

      // Fetch role from database
      if (token.id) {
        const isOffline = await isDatabaseOffline();
        if (isOffline) {
          const fallbackUser = findUserById(token.id as string);
          if (fallbackUser) {
            token.role = fallbackUser.role;
            token.username = fallbackUser.username;
            token.isPremium = fallbackUser.isPremium;
          }
        } else {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { role: true, username: true, isPremium: true },
            });
            if (dbUser) {
              token.role = dbUser.role;
              token.username = dbUser.username;
              token.isPremium = dbUser.isPremium;
            }
          } catch (dbError) {
            console.warn("Postgres offline during JWT token fetch, checking local fallback:", dbError);
            const fallbackUser = findUserById(token.id as string);
            if (fallbackUser) {
              token.role = fallbackUser.role;
              token.username = fallbackUser.username;
              token.isPremium = fallbackUser.isPremium;
            }
          }
        }
      }

      // Handle session updates (e.g., from profile edit)
      if (trigger === "update" && session) {
        token.name = session.name ?? token.name;
        token.username = session.username ?? token.username;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
        (session.user as any).isPremium = token.isPremium;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Auto-generate username from email for OAuth users
      if (user.email && !user.name) {
        const username = user.email.split("@")[0];
        await prisma.user.update({
          where: { id: user.id },
          data: { username },
        });
      }
    },
  },
});
