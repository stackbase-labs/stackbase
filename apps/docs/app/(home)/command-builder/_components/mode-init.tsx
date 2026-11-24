"use client";

import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { cn } from "@/lib/cn";
import {
  packageManagers,
  templateNames,
  templates,
  type BuilderState,
  type PackageManager,
  type TemplateName,
} from "../command-builder";
import {
  BuilderSection,
  FeatureGroup,
  FlagCard,
  SelectField,
} from "./builder-primitives";

export function InitControls({
  state,
  update,
  projectNameError,
}: {
  state: BuilderState;
  update: (patch: Partial<BuilderState>) => void;
  projectNameError?: string;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="project-name">Project name</FieldLabel>
          <Input
            id="project-name"
            value={state.projectName}
            onChange={(event) => update({ projectName: event.target.value })}
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
              className="text-destructive text-xs mt-1"
            >
              {projectNameError}
            </p>
          ) : null}
        </Field>

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
      </div>

      <BuilderSection title="Template">
        <RadioGroup
          value={state.template}
          onValueChange={(template) =>
            update({ template: template as TemplateName })
          }
          aria-label="Project template"
        >
          <div className="grid gap-3.5 sm:grid-cols-3">
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
                      "w-full transition-all h-full cursor-pointer select-none",
                      selected
                        ? "border-primary/80 ring-1 ring-primary/30 bg-primary/5 dark:bg-primary/10"
                        : "border-border/70 bg-card hover:border-border hover:bg-muted/40 shadow-2xs",
                    )}
                  >
                    <CardContent>
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>{definition.label}</FieldTitle>
                          <FieldDescription>{definition.hint}</FieldDescription>
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {definition.techBadges.map((badge) => (
                              <span
                                key={badge}
                                className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
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

      <BuilderSection title="Features and tooling">
        <InitFeatureControls state={state} update={update} />
      </BuilderSection>
    </>
  );
}

function InitFeatureControls({
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
      flag: "--docker",
      label: "Docker",
      description: "Container configuration",
      checked: state.docker,
      onCheckedChange: (docker: boolean) => update({ docker }),
    },
    {
      id: "observability",
      flag: "--observability",
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
      flag: "--kubernetes",
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
      flag: "--studio",
      label: "Prisma Studio",
      description: "Database browser",
      checked: state.studio,
      onCheckedChange: (studio: boolean) => update({ studio }),
    },
    {
      id: "git",
      flag: "--git",
      label: "Initialize Git",
      description: "Create a repository",
      checked: state.git,
      onCheckedChange: (git: boolean) => update({ git }),
    },
    {
      id: "install",
      flag: "--install",
      label: "Install dependencies",
      description: "Run package install",
      checked: state.install,
      onCheckedChange: (install: boolean) => update({ install }),
    },
    {
      id: "verbose",
      flag: "--verbose",
      label: "Verbose output",
      description: "Show detailed logs",
      checked: state.verbose,
      onCheckedChange: (verbose: boolean) => update({ verbose }),
    },
  ];

  function renderOption(option: (typeof options)[number]) {
    return (
      <FlagCard
        key={option.id}
        flag={option.flag}
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
    <div className="space-y-6">
      <FeatureGroup title="Deployment">
        {deploymentOptions.map(renderOption)}
      </FeatureGroup>
      <FeatureGroup title="Developer workflow">
        {workflowOptions.map(renderOption)}
      </FeatureGroup>
    </div>
  );
}
