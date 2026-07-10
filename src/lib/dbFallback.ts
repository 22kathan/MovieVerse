// ============================================
// MovieVerse — Database Fallback Helper
// Persists users and sessions locally in a JSON file when Postgres is offline
// ============================================

import fs from "fs";
import path from "path";

const FALLBACK_FILE = path.join(process.cwd(), "db_fallback.json");

export interface MockUser {
  id: string;
  name: string | null;
  email: string;
  hashedPassword: string | null;
  username: string | null;
  role: "GUEST" | "REGISTERED" | "PREMIUM" | "ADMIN";
  isPremium: boolean;
  premiumUntil: string | null;
  createdAt: string;
  bio?: string | null;
  country?: string | null;
}

// Ensure the fallback database file exists
function ensureFile() {
  if (!fs.existsSync(FALLBACK_FILE)) {
    // Seed with a default admin user
    const defaultAdmin: MockUser = {
      id: "admin-default-id",
      name: "Admin User",
      email: "admin@movieverse.com",
      // bcrypt hash for "password123"
      hashedPassword: "$2b$12$5bTjowuU8ds97dhA7XfPMeEKUKrcNqxkiBYO6iyUbUhB4nLTNhEGm", 
      username: "admin",
      role: "ADMIN",
      isPremium: true,
      premiumUntil: null,
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify([defaultAdmin], null, 2), "utf8");
  }
}

export function getUsers(): MockUser[] {
  try {
    ensureFile();
    const data = fs.readFileSync(FALLBACK_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading fallback database:", error);
    return [];
  }
}

export function saveUsers(users: MockUser[]) {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(users, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing fallback database:", error);
  }
}

export function findUserByEmail(email: string): MockUser | undefined {
  const users = getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserByUsername(username: string): MockUser | undefined {
  const users = getUsers();
  return users.find((u) => u.username?.toLowerCase() === username.toLowerCase());
}

export function findUserById(id: string): MockUser | undefined {
  const users = getUsers();
  return users.find((u) => u.id === id);
}

export function createUser(userData: Partial<MockUser>): MockUser {
  const users = getUsers();
  const newUser: MockUser = {
    id: userData.id || `mock_${Math.random().toString(36).substr(2, 9)}`,
    name: userData.name || null,
    email: userData.email || "",
    hashedPassword: userData.hashedPassword || null,
    username: userData.username || null,
    role: userData.role || "REGISTERED",
    isPremium: userData.isPremium || false,
    premiumUntil: userData.premiumUntil || null,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function updateUser(id: string, updateData: Partial<MockUser>): MockUser | undefined {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updateData };
    saveUsers(users);
    return users[index];
  }
  return undefined;
}
