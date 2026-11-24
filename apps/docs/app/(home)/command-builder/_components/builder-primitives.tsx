"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { Field, FieldLabel } from "@workspace/ui/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@/lib/cn";

export function BuilderSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      {description ? (
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      ) : (
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export function FeatureGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function SelectField({
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
        <SelectTrigger id={id} className="w-full h-9">
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

export function FlagCard({
  flag,
  label,
  description,
  checked,
  disabled = false,
  disabledReason,
  onCheckedChange,
}: {
  flag: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "group relative flex flex-col justify-between rounded-lg border p-3.5 text-left transition-all select-none cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        checked
          ? "border-primary/80 bg-primary/5 ring-1 ring-primary/30 dark:bg-primary/10"
          : "border-border/70 bg-card hover:border-border hover:bg-muted/40 shadow-2xs",
      )}
    >
      <div className="flex items-start justify-between gap-2 w-full">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <code
            className={cn(
              "font-mono text-xs px-1.5 py-0.5 rounded font-semibold transition-colors shrink-0",
              checked
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground group-hover:text-foreground",
            )}
          >
            {flag}
          </code>
          <span
            className={cn(
              "text-xs font-medium transition-colors",
              checked ? "text-foreground font-semibold" : "text-foreground/90",
            )}
          >
            {label}
          </span>
        </div>
        <div
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded border transition-all mt-0.5",
            checked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/30 bg-background group-hover:border-muted-foreground/50",
          )}
        >
          {checked && <Check className="size-3 stroke-3" />}
        </div>
      </div>
      {(disabled ? disabledReason : description) && (
        <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">
          {disabled ? disabledReason : description}
        </p>
      )}
    </button>
  );
}
