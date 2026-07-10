"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import SectionHeader from "@/components/shared/SectionHeader";
import { FolderHeart, Plus, Film, Trash2, Loader2 } from "lucide-react";

interface CustomList {
  id: string;
  name: string;
  description: string;
  itemsCount: number;
  createdAt: string;
}

export default function MyListsPage() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [lists, setLists] = useState<CustomList[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load lists
  useEffect(() => {
    setMounted(true);
    if (status === "loading") return;

    if (session?.user?.id) {
      // Fetch from API
      setLoading(true);
      fetch(`/api/lists?userId=${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.lists) {
            const formatted = data.lists.map((l: any) => ({
              id: l.id,
              name: l.name,
              description: l.description || "",
              itemsCount: l._count?.items ?? 0,
              createdAt: l.createdAt,
            }));
            setLists(formatted);
          }
        })
        .catch((err) => console.error("Error fetching lists:", err))
        .finally(() => setLoading(false));
    } else {
      // LocalStorage fallback
      const savedLists = localStorage.getItem("movieverse_custom_lists");
      if (savedLists) {
        setLists(JSON.parse(savedLists));
      } else {
        const defaultLists: CustomList[] = [
          {
            id: "1",
            name: "🍿 Weekend Binge List",
            description: "Top movies to watch this weekend with family",
            itemsCount: 3,
            createdAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "🔥 All-time Sci-Fi Favorites",
            description: "Mind-bending space and tech films",
            itemsCount: 2,
            createdAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem("movieverse_custom_lists", JSON.stringify(defaultLists));
        setLists(defaultLists);
      }
    }
  }, [session, status]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (session?.user?.id) {
      setLoading(true);
      try {
        const res = await fetch("/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            isPublic: true,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const newList: CustomList = {
            id: data.list.id,
            name: data.list.name,
            description: data.list.description || "",
            itemsCount: 0,
            createdAt: data.list.createdAt,
          };
          setLists((prev) => [newList, ...prev]);
          setName("");
          setDescription("");
          setShowAddForm(false);
        } else {
          const err = await res.json();
          alert(err.error || "Failed to create list");
        }
      } catch (err) {
        console.error("Error creating list:", err);
      } finally {
        setLoading(false);
      }
    } else {
      const newList: CustomList = {
        id: Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        description: description.trim(),
        itemsCount: 0,
        createdAt: new Date().toISOString(),
      };

      const updated = [newList, ...lists];
      localStorage.setItem("movieverse_custom_lists", JSON.stringify(updated));
      setLists(updated);
      setName("");
      setDescription("");
      setShowAddForm(false);
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm("Are you sure you want to delete this list?")) return;

    if (session?.user?.id) {
      setLoading(true);
      try {
        const res = await fetch(`/api/lists/${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          setLists((prev) => prev.filter((l) => l.id !== id));
        } else {
          const err = await res.json();
          alert(err.error || "Failed to delete list");
        }
      } catch (err) {
        console.error("Error deleting list:", err);
      } finally {
        setLoading(false);
      }
    } else {
      const updated = lists.filter((l) => l.id !== id);
      localStorage.setItem("movieverse_custom_lists", JSON.stringify(updated));
      setLists(updated);
    }
  };

  if (!mounted || status === "loading") {
    return (
      <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
        <SectionHeader title="My Lists" subtitle="Your custom movie and TV show lists" />
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-[var(--bg-surface)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeader
          title="📁 Custom Collections"
          subtitle="Organise your favourite titles into curated lists"
        />
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white font-semibold text-xs shadow-md hover:scale-[1.01] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New List</span>
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleCreateList}
          className="max-w-md p-5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl space-y-4 shadow-sm animate-fade-in-up"
        >
          <h3 className="font-bold text-white text-sm">New Collection</h3>
          <div className="space-y-1">
            <input
              type="text"
              required
              placeholder="List name (e.g. Classic Horror)..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-3 outline-none focus:border-[var(--brand-primary)] transition-all"
            />
          </div>
          <div className="space-y-1">
            <input
              type="text"
              placeholder="Short description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-3 outline-none focus:border-[var(--brand-primary)] transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white font-semibold text-xs hover:bg-[var(--brand-primary-dark)] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save List</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] font-semibold text-xs hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && lists.length === 0 ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 text-[var(--brand-primary-light)] animate-spin" />
        </div>
      ) : lists.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <div
              key={list.id}
              className="group relative flex flex-col justify-between p-5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl shadow-sm hover:border-[var(--border-secondary)] transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center border border-[var(--border-primary)] text-lg">
                    📁
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base group-hover:text-[var(--brand-primary-light)] transition-colors">
                      {list.name}
                    </h4>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      {list.itemsCount} Titles
                    </span>
                  </div>
                </div>

                {list.description && (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {list.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--border-primary)]/50">
                <span className="text-[10px] text-[var(--text-muted)]">
                  Created: {new Date(list.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteList(list.id)}
                    className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--error)] border border-[var(--border-primary)] hover:border-[var(--error)]/30 transition-all cursor-pointer"
                    title="Delete List"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="text-6xl">📁</div>
          <h3 className="text-xl font-bold text-white">No collections yet</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm">
            Create custom lists to group your favorite movies and TV shows.
          </p>
        </div>
      )}
    </div>
  );
}
