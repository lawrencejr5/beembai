"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const viewer = useQuery(api.users.viewer);
  const router = useRouter();

  useEffect(() => {
    // viewer === null means not authenticated
    if (viewer === null) {
      router.replace("/login");
      return;
    }
    // viewer loaded but not admin
    if (viewer !== undefined && !viewer.isAdmin) {
      router.replace("/");
    }
  }, [viewer, router]);

  // Still loading
  if (viewer === undefined) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1a1900",
      }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#c8b840",
              animation: "pulse 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,80%,100%{opacity:.2;transform:scale(.85)}40%{opacity:1;transform:scale(1.15)} }`}</style>
      </div>
    );
  }

  if (!viewer?.isAdmin) return null;

  return <>{children}</>;
}
