"use client";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { Check, Copy, Info } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import {
  buildCommand,
  getResultSummary,
  initialBuilderState,
  normalizeBuilderState,
  packageManagers,
  runners,
  templateNames,
  templates,
  validateProjectName,
  type BuilderState,
  type PackageManager,
  type Runner,
  type TemplateName,
} from "../command-builder";

const runnerLabels: Record<Runner, string> = {
  pnpm: "pnpm dlx",
  npm: "npx",
  bun: "bunx",
};

export function CommandBuilder() {
  const [state, setState] = useState(initialBuilderState);
  const [copied, setCopied] = useState(false);
  const projectNameError = validateProjectName(state.projectName);
  const command = useMemo(() => buildCommand(state), [state]);
  const summary = useMemo(() => getResultSummary(state), [state]);

  function update(patch: Partial<BuilderState>) {
    setState((current) => normalizeBuilderState({ ...current, ...patch }));
  }

  async function copyCommand() {
    if (projectNameError) return;

    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="bg-background text-foreground min-h-[calc(100vh-3.5rem)] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-248">
        <header className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Build your command
          </h1>
          <p className="text-muted-foreground mt-4">
            Configure a project and copy the matching Stackbase command.
          </p>
        </header>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
          <div>
            <BuilderSection title="Project">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="project-name">Project name</FieldLabel>
                  <Input
                    id="project-name"
                    value={state.projectName}
                    onChange={(event) =>
                      update({ projectName: event.target.value })
                    }
                    aria-invalid={Boolean(projectNameError)}
                    aria-describedby={
                      projectNameError ? "project-name-error" : undefined
                    }
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {projectNameError ? (
                    <p
                      id="project-name-error"
                      role="alert"
                      className="text-destructive text-xs"
                    >
                      {projectNameError}
                    </p>
                  ) : null}
                </Field>

                <SelectField
                  id="runner"
                  label="Run with"
                  value={state.runner}
                  onValueChange={(runner) =>
                    update({ runner: runner as Runner })
                  }
                  options={runners.map((runner) => ({
                    value: runner,
                    label: runnerLabels[runner],
                  }))}
                />
              </div>
            </BuilderSection>

            <BuilderSection title="Template">
              <RadioGroup
                value={state.template}
                onValueChange={(template) =>
                  update({ template: template as TemplateName })
                }
                aria-label="Project template"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  {templateNames.map((template) => {
                    const definition = templates[template];
                    const selected = state.template === template;
                    const id = "template-" + template;

                    return (
                      <FieldLabel
                        key={template}
                        htmlFor={id}
                        className="w-full cursor-pointer"
                      >
                        <Card
                          size="sm"
                          className={cn(
                            "w-full",
                            selected ? "ring-foreground" : "ring-transparent",
                          )}
                        >
                          <CardContent>
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle>{definition.label}</FieldTitle>
                                <FieldDescription>
                                  {definition.hint}
                                </FieldDescription>
                              </FieldContent>
                              <RadioGroupItem value={template} id={id} />
                            </Field>
                          </CardContent>
                        </Card>
                      </FieldLabel>
                    );
                  })}
                </div>
              </RadioGroup>
            </BuilderSection>

            <BuilderSection title="Runtime and features">
              <SelectField
                id="package-manager"
                label="Package manager"
                value={state.packageManager}
                onValueChange={(packageManager) =>
                  update({ packageManager: packageManager as PackageManager })
                }
                options={packageManagers.map((packageManager) => ({
                  value: packageManager,
                  label: packageManager,
                }))}
              />

              <FeatureControls state={state} update={update} />
            </BuilderSection>
          </div>

          <aside className="lg:sticky lg:top-20">
            <section>
              <h2 className="text-sm font-medium">Command</h2>
              <div className="bg-card mt-4 border rounded-lg">
                <div className="flex h-11 items-center justify-between border-b px-3">
                  <span className="text-muted-foreground text-sm">
                    Terminal
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={copied ? "Command copied" : "Copy command"}
                    disabled={Boolean(projectNameError)}
                    onClick={() => void copyCommand()}
                  >
                    {copied ? <Check /> : <Copy />}
                  </Button>
                </div>
                <pre
                  className="min-h-36 p-4 font-mono text-sm leading-7 wrap-break-words whitespace-pre-wrap"
                  aria-live="polite"
                >
                  <span className="text-muted-foreground select-none">$ </span>
                  {command}
                </pre>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-sm font-medium">Result</h2>
              <dl className="mt-3 text-sm">
                <SummaryRow label="Template" value={summary.template} />
                <SummaryRow label="Apps" value={summary.apps.join(", ")} />
                <SummaryRow
                  label="Operations"
                  value={summary.operations.join(", ") || "None"}
                />
              </dl>
            </section>

            <div className="text-muted-foreground mt-6 flex gap-2 text-xs leading-5">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>
                The command includes every supported feature choice. No hidden
                defaults.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function FeatureControls({
  state,
  update,
}: {
  state: BuilderState;
  update: (patch: Partial<BuilderState>) => void;
}) {
  const capabilities = templates[state.template].capabilities;
  const templateLabel = templates[state.template].label;
  const options = [
    {
      id: "docker",
      label: "Docker",
      description: "Container configuration",
      checked: state.docker,
      onCheckedChange: (docker: boolean) => update({ docker }),
    },
    {
      id: "observability",
      label: "Observability",
      description: "Metrics and tracing",
      checked: state.observability,
      disabled: !state.docker || !capabilities.observability,
      disabledReason: !capabilities.observability
        ? templateLabel + " does not include observability."
        : "Requires Docker.",
      onCheckedChange: (observability: boolean) => update({ observability }),
    },
    {
      id: "kubernetes",
      label: "Kubernetes",
      description: "Deployment manifests",
      checked: state.kubernetes,
      disabled: !state.docker || !capabilities.kubernetes,
      disabledReason: !capabilities.kubernetes
        ? templateLabel + " does not include Kubernetes."
        : "Requires Docker.",
      onCheckedChange: (kubernetes: boolean) => update({ kubernetes }),
    },
    {
      id: "studio",
      label: "Prisma Studio",
      description: "Database browser",
      checked: state.studio,
      onCheckedChange: (studio: boolean) => update({ studio }),
    },
    {
      id: "git",
      label: "Initialize Git",
      description: "Create a repository",
      checked: state.git,
      onCheckedChange: (git: boolean) => update({ git }),
    },
    {
      id: "install",
      label: "Install dependencies",
      description: "Run package install",
      checked: state.install,
      onCheckedChange: (install: boolean) => update({ install }),
    },
    {
      id: "verbose",
      label: "Verbose output",
      description: "Show detailed logs",
      checked: state.verbose,
      onCheckedChange: (verbose: boolean) => update({ verbose }),
    },
  ];

  function renderOption(option: (typeof options)[number]) {
    return (
      <FeatureSwitch
        key={option.id}
        id={option.id}
        label={option.label}
        description={option.description}
        checked={option.checked}
        disabled={option.disabled}
        disabledReason={option.disabledReason}
        onCheckedChange={option.onCheckedChange}
      />
    );
  }

  const deploymentOptions = options.slice(0, 3);
  const workflowOptions = options.slice(3);

  return (
    <div className="mt-6 space-y-5">
      <FeatureGroup title="Deployment">
        {deploymentOptions.map(renderOption)}
      </FeatureGroup>
      <FeatureGroup title="Developer workflow">
        {workflowOptions.map(renderOption)}
      </FeatureGroup>
    </div>
  );
}

function FeatureGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
        {title}
      </h3>
      <div className="grid border-t sm:grid-cols-2 sm:gap-x-7">{children}</div>
    </section>
  );
}

function BuilderSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b py-7 first:pt-0 last:border-b-0 last:pb-0">
      <h2 className="mb-5 text-sm font-medium">{title}</h2>
      {children}
    </section>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onValueChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onValueChange: (value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          position="popper"
          className="min-w-(--radix-select-trigger-width)"
        >
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function FeatureSwitch({
  id,
  label,
  description,
  checked,
  disabled = false,
  disabledReason,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b">
      <div>
        <Label htmlFor={id}>{label}</Label>
        {disabledReason || description ? (
          <p className="text-muted-foreground mt-1 text-xs">
            {disabled ? disabledReason : description}
          </p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-h-10 grid-cols-[7rem_1fr] items-center border-b">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
