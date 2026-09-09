import { NPM } from "@/components/icons/npm";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { BookIcon, HistoryIcon, Layers } from "lucide-react";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <span className="font-semibold">Stackbase</span>
        </div>
      ),
    },
    links: [
      {
        icon: <BookIcon />,
        text: "Documentation",
        url: "/docs",
        secondary: false,
      },
      {
        icon: <HistoryIcon />,
        text: "Changelog",
        url: "/changelog",
        secondary: false,
      },
      {
        type: "icon",
        icon: <NPM />,
        text: "NPM",
        url: "https://www.npmjs.com/package/stackbase",
        external: true,
      },
    ],
    githubUrl: "https://github.com/stackbase-labs/stackbase",
  };
}
