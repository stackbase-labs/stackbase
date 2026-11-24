"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  CreditCard,
  FileJson,
  GitCommit,
  Globe,
  RefreshCw,
  Rocket,
  Search,
  Server,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@workspace/ui/components/select";
import { cn } from "@/lib/cn";
import {
  buildCommand,
  commandModes,
  getInitialModeState,
  getWorkspaceTree,
  initialBuilderState,
  normalizeBuilderState,
  presetsByMode,
  validateProjectName,
  type BuilderState,
} from "../command-builder";
import { AddControls } from "./mode-add";
import { DoctorControls } from "./mode-doctor";
import { InitControls } from "./mode-init";
import { UpgradeControls } from "./mode-upgrade";
import { TerminalCard } from "./terminal-card";
import { WorkspaceTreeView } from "./workspace-tree";

const presetIcons: Record<string, typeof Sparkles> = {
  Rocket,
  Globe,
  Server,
  CreditCard,
  Bot,
  Zap,
  BarChart3,
  Wrench,
  Search,
  FileJson,
  GitCommit,
  RefreshCw,
  Sparkles,
};

export function CommandBuilder() {
  const [state, setState] = useState<BuilderState>(initialBuilderState);
  const [copied, setCopied] = useState(false);
  const [multiLine, setMultiLine] = useState(false);

  const projectNameError =
    state.mode === "init" ? validateProjectName(state.projectName) : undefined;
  const command = useMemo(
    () => buildCommand(state, { multiLine }),
    [state, multiLine],
  );
  const workspaceTree = useMemo(() => getWorkspaceTree(state), [state]);

  function update(patch: Partial<BuilderState>) {
    setState((current) => normalizeBuilderState({ ...current, ...patch }));
  }

  function resetCurrentMode() {
    update(getInitialModeState(state.mode));
  }

  async function copyCommand() {
    if (projectNameError) return;

    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const activePresets = presetsByMode[state.mode];

  return (
    <main className="bg-background text-foreground min-h-[calc(100vh-3.5rem)] py-10 pb-28 lg:pb-16">
      <div className="mx-auto max-w-5xl px-4">
        {/* Streamlined Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Build your command
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Configure project scaffolding, modules, and monorepo maintenance.
          </p>
        </div>

        {/* Toolbar: Mode Tabs (Left) + Presets (Right) */}
        <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label="Command Mode"
            className="bg-muted p-1 rounded-lg w-full md:w-auto grid grid-cols-4 gap-1 relative"
          >
            {commandModes.map((mode) => {
              const active = state.mode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => update({ mode })}
                  className={cn(
                    "relative min-w-0 px-1.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-mono rounded-md transition-colors cursor-pointer z-10 text-center flex items-center justify-center",
                    active
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="active-command-mode"
                      className="absolute inset-0 bg-background rounded-md shadow-xs -z-10"
                      transition={{
                        type: "spring",
                        bounce: 0.15,
                        duration: 0.35,
                      }}
                    />
                  )}
                  <span className="truncate">{mode}</span>
                </button>
              );
            })}
          </div>

          {/* Mode-Scoped Presets Dropdown */}
          {activePresets && activePresets.length > 0 && (
            <div className="w-40 sm:w-48 shrink-0 self-end md:self-auto">
              <label htmlFor="preset-select" className="sr-only">
                Presets
              </label>
              <Select
                value=""
                onValueChange={(presetId) => {
                  const found = activePresets.find((p) => p.id === presetId);
                  if (found) update(found.patch);
                }}
              >
                <SelectTrigger
                  id="preset-select"
                  aria-label="Presets"
                  className="w-full h-8 text-xs bg-muted/60 hover:bg-muted border-border/60 transition-colors"
                >
                  <span className="flex items-center gap-1.5 text-muted-foreground truncate font-medium">
                    <Sparkles className="size-3.5 text-primary shrink-0" />
                    <span>Presets</span>
                  </span>
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  align="end"
                  className="w-72 sm:w-80 p-1.5 shadow-lg"
                >
                  {activePresets.map((preset) => {
                    const Icon =
                      presetIcons[preset.icon ?? "Sparkles"] ?? Sparkles;
                    return (
                      <SelectItem
                        key={preset.id}
                        value={preset.id}
                        className="text-xs p-2 pr-2.5 pl-2.5 rounded-md cursor-pointer transition-colors my-0.5"
                      >
                        <div className="flex items-start gap-2.5 w-full">
                          <div className="size-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5 border border-border/50 text-foreground/80">
                            <Icon className="size-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-semibold text-foreground text-xs truncate">
                                {preset.label}
                              </span>
                              {preset.tag && (
                                <span className="text-[10px] font-mono font-medium px-1.5 py-px rounded bg-muted text-muted-foreground border border-border/60 shrink-0">
                                  {preset.tag}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                              {preset.description}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Studio Grid: Configurator (Left) + Architecture & Terminal (Right) */}
        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="space-y-8">
            {state.mode === "init" && (
              <InitControls
                state={state}
                update={update}
                projectNameError={projectNameError}
              />
            )}

            {state.mode === "add" && (
              <AddControls state={state} update={update} />
            )}

            {state.mode === "doctor" && (
              <DoctorControls state={state} update={update} />
            )}

            {state.mode === "upgrade" && (
              <UpgradeControls state={state} update={update} />
            )}
          </div>

          {/* Sticky Sidebar: Command Terminal (Top) + Workspace Architecture (Bottom) */}
          <aside className="space-y-6 lg:sticky lg:top-20">
            {/* Live Terminal Command Block */}
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-tight">
                  Command
                </h2>
                {copied && (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Copied to clipboard
                  </span>
                )}
              </div>
              <TerminalCard
                command={command}
                runner={state.runner}
                onRunnerChange={(runner) => update({ runner })}
                multiLine={multiLine}
                onToggleMultiLine={() => setMultiLine((prev) => !prev)}
                onReset={resetCurrentMode}
                onCopy={() => void copyCommand()}
                copied={copied}
                disableCopy={Boolean(projectNameError)}
              />
            </section>

            {/* Live Workspace Architecture Tree */}
            <section>
              <h2 className="text-sm font-semibold tracking-tight mb-2">
                Workspace architecture
              </h2>
              <WorkspaceTreeView node={workspaceTree} />
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
