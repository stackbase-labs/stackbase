"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

const STORAGE_KEY = "stackbase-banner-dismissed";

export function AnnouncementBanner() {
  const dismissed = useSyncExternalStore(
    (onStoreChange) => {
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY) {
          onStoreChange();
        }
      };
      const handleBannerChange = () => onStoreChange();

      window.addEventListener("storage", handleStorageChange);
      window.addEventListener("stackbase-banner-change", handleBannerChange);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener(
          "stackbase-banner-change",
          handleBannerChange,
        );
      };
    },
    () => {
      try {
        return localStorage.getItem(STORAGE_KEY) === "true";
      } catch {
        return false;
      }
    },
    () => false,
  );

  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
      window.dispatchEvent(new Event("stackbase-banner-change"));
    } catch {
      // Ignore localStorage access errors
    }
  };

  return (
    <div className="relative flex items-center justify-center gap-2 border-b border-border/40 bg-primary/5 px-4 py-2.5 text-center text-xs font-medium text-foreground">
      <Link
        href="/changelog"
        className="inline-flex items-center gap-1 text-primary hover:underline"
      >
        <span>
          🎉 Stackbase 2.0 is here: Next.js 16, Better Auth 2FA, and Kubernetes
          manifests
        </span>
        <ArrowRight className="size-3" />
      </Link>
      <button
        type="button"
        aria-label="Dismiss banner"
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
