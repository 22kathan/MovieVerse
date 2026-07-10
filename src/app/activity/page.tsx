import { Metadata } from "next";
import SectionHeader from "@/components/shared/SectionHeader";
import ActivityFeed from "@/components/social/ActivityFeed";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Friend Activity | MovieVerse",
  description: "See what your friends and the community are watching, rating, and reviewing on MovieVerse.",
};

export default async function ActivityPage() {
  const session = await auth();
  const initialType = session?.user?.id ? "social" : "global";

  return (
    <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
      <div>
        <SectionHeader
          title="⚡ Friend Activity"
          subtitle="Real-time updates on what movies and TV shows your network is liking"
        />
      </div>

      <div className="max-w-2xl">
        <ActivityFeed initialType={initialType} />
      </div>
    </div>
  );
}
