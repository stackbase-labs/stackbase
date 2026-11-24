"use client";

import { Layers, Sparkles } from "lucide-react";

import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@workspace/ui/components/field";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { cn } from "@/lib/cn";
import {
  addModules,
  modules,
  type AddModule,
  type BuilderState,
  type TargetApp,
} from "../command-builder";
import { BuilderSection, FlagCard, SelectField } from "./builder-primitives";

export const targetAppOptions: readonly {
  id: TargetApp;
  label: string;
}[] = [
  { id: "none", label: "Auto-detect (recommended)" },
  { id: "api", label: "Backend (apps/api)" },
  { id: "web", label: "Frontend (apps/web)" },
  { id: "api,web", label: "Both (apps/api & apps/web)" },
];

export function AddControls({
  state,
  update,
}: {
  state: BuilderState;
  update: (patch: Partial<BuilderState>) => void;
}) {
  const growthModules = addModules.filter(
    (name) => modules[name].category === "growth",
  );
  const infraModules = addModules.filter(
    (name) => modules[name].category === "infrastructure",
  );

  function renderModuleCard(moduleName: AddModule) {
    const def = modules[moduleName];
    const selected = state.addModule === moduleName;
    const id = "module-" + moduleName;

    return (
      <FieldLabel
        key={moduleName}
        htmlFor={id}
        className="w-full cursor-pointer"
      >
        <Card
          size="sm"
          className={cn(
            "w-full h-full transition-all cursor-pointer select-none",
            selected
              ? "border-primary/80 ring-1 ring-primary/30 bg-primary/5 dark:bg-primary/10"
              : "border-border/70 bg-card hover:border-border hover:bg-muted/40 shadow-2xs",
          )}
        >
          <CardContent>
            <Field orientation="horizontal">
              <FieldContent>
                <div className="flex items-center gap-2">
                  <FieldTitle>{def.label}</FieldTitle>
                  {def.isOptIn && (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                      Opt-in
                    </span>
                  )}
                </div>
                <FieldDescription>{def.description}</FieldDescription>
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {def.techBadges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </FieldContent>
              <RadioGroupItem value={moduleName} id={id} />
            </Field>
          </CardContent>
        </Card>
      </FieldLabel>
    );
  }

  return (
    <>
      <div className="max-w-md">
        <SelectField
          id="target-app"
          label="Target application"
          value={state.targetApp}
          onValueChange={(targetApp) =>
            update({ targetApp: targetApp as TargetApp })
          }
          options={targetAppOptions.map((opt) => ({
            value: opt.id,
            label: opt.label,
          }))}
        />
      </div>

      <BuilderSection title="Select module">
        {state.addList ? (
          <div className="text-muted-foreground bg-muted/40 border rounded-lg p-4 text-xs">
            Module selection is ignored when the{" "}
            <code className="text-foreground font-mono">--list</code> flag is
            enabled. Uncheck it below to install a specific module.
          </div>
        ) : (
          <RadioGroup
            value={state.addModule}
            onValueChange={(addModule) =>
              update({ addModule: addModule as AddModule | "none" })
            }
            aria-label="Module to add"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-emerald-500" />
                  Growth & Intelligence (New Opt-in)
                </h3>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {growthModules.map(renderModuleCard)}
                </div>
              </div>

              <div>
                <h3 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" />
                  Core Infrastructure & Services
                </h3>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {infraModules.map(renderModuleCard)}
                </div>
              </div>

              <div>
                <FieldLabel
                  htmlFor="module-none"
                  className="w-full cursor-pointer"
                >
                  <Card
                    size="sm"
                    className={cn(
                      "w-full transition-all cursor-pointer select-none",
                      state.addModule === "none"
                        ? "border-primary/80 ring-1 ring-primary/30 bg-primary/5 dark:bg-primary/10"
                        : "border-border/70 bg-card hover:border-border hover:bg-muted/40 shadow-2xs",
                    )}
                  >
                    <CardContent>
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>Interactive Selection</FieldTitle>
                          <FieldDescription>
                            Omit the module argument to choose interactively
                            from the terminal prompt.
                          </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value="none" id="module-none" />
                      </Field>
                    </CardContent>
                  </Card>
                </FieldLabel>
              </div>
            </div>
          </RadioGroup>
        )}
      </BuilderSection>

      <BuilderSection title="Flags and options">
        <div className="grid gap-3 sm:grid-cols-2">
          <FlagCard
            flag="-y, --yes"
            label="Skip prompts"
            description="Skip prompts and use default selections"
            checked={state.addYes}
            onCheckedChange={(addYes) => update({ addYes })}
          />
          <FlagCard
            flag="--dry-run"
            label="Dry run"
            description="Preview file modifications without writing"
            checked={state.addDryRun}
            onCheckedChange={(addDryRun) => update({ addDryRun })}
          />
          <FlagCard
            flag="--skip-install"
            label="Skip install"
            description="Skip automatic dependency installation"
            checked={state.addSkipInstall}
            onCheckedChange={(addSkipInstall) => update({ addSkipInstall })}
          />
          <FlagCard
            flag="--allow-dirty"
            label="Allow dirty tree"
            description="Proceed with uncommitted git modifications"
            checked={state.addAllowDirty}
            onCheckedChange={(addAllowDirty) => update({ addAllowDirty })}
          />
          <FlagCard
            flag="--verbose"
            label="Verbose output"
            description="Display detailed installation and debug output"
            checked={state.addVerbose}
            onCheckedChange={(addVerbose) => update({ addVerbose })}
          />
          <FlagCard
            flag="--list"
            label="List modules"
            description="List available modules and installation status"
            checked={state.addList}
            onCheckedChange={(addList) => update({ addList })}
          />
        </div>
      </BuilderSection>
    </>
  );
}
