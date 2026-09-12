import { NPM } from "@/components/icons/npm";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { BookIcon, HistoryIcon } from "lucide-react";
import Image from "next/image";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Stackbase"
            width={22}
            height={22}
            className="rounded"
          />
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
