"use client";

import { FileCode, Folder, FolderOpen } from "lucide-react";

import { cn } from "@/lib/cn";
import type { WorkspaceNode } from "../command-builder";

export function WorkspaceTreeView({ node }: { node: WorkspaceNode }) {
  return (
    <div className="bg-card border rounded-lg p-3.5 text-xs font-mono shadow-xs overflow-hidden">
      <div className="flex items-center gap-1.5 text-foreground font-semibold pb-2 border-b border-border/50">
        <FolderOpen className="size-4 text-primary shrink-0" />
        <span className="truncate">{node.name}/</span>
      </div>
      <div className="pt-2 pl-0.5 space-y-1">
        {node.children?.map((child, index) => (
          <TreeNodeItem key={index} node={child} />
        ))}
      </div>
    </div>
  );
}

function TreeNodeItem({ node }: { node: WorkspaceNode }) {
  const isFolder = node.type === "folder";

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center justify-between gap-2 py-0.5 px-1.5 rounded-md transition-colors",
          node.highlight
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-muted/40",
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {isFolder ? (
            <Folder
              className={cn(
                "size-3.5 shrink-0",
                node.highlight ? "text-primary" : "text-muted-foreground",
              )}
            />
          ) : (
            <FileCode
              className={cn(
                "size-3.5 shrink-0",
                node.highlight ? "text-primary" : "text-muted-foreground",
              )}
            />
          )}
          <span
            className={cn(
              "truncate",
              node.highlight
                ? "font-semibold text-foreground"
                : "text-foreground/90",
            )}
          >
            {node.name}
            {isFolder ? "/" : ""}
          </span>
        </div>
        {node.badge && (
          <span
            className={cn(
              "text-[10px] px-1.5 py-px rounded-md font-sans border font-medium shrink-0 tracking-wide",
              node.badgeVariant === "added" &&
                "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold",
              node.badgeVariant === "primary" &&
                "bg-primary/10 text-primary border-primary/20",
              node.badgeVariant === "default" &&
                "bg-muted text-muted-foreground border-border/50",
              node.badgeVariant === "muted" &&
                "text-muted-foreground/60 border-transparent",
            )}
          >
            {node.badge}
          </span>
        )}
      </div>

      {node.children && node.children.length > 0 && (
        <div className="border-l border-border/40 pl-3 ml-2.5 space-y-1 my-0.5">
          {node.children.map((child, idx) => (
            <TreeNodeItem key={idx} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
