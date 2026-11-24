"use client";

import type { BuilderState } from "../command-builder";
import { BuilderSection, FlagCard } from "./builder-primitives";

export function DoctorControls({
  state,
  update,
}: {
  state: BuilderState;
  update: (patch: Partial<BuilderState>) => void;
}) {
  return (
    <BuilderSection title="Diagnostic checks">
      <div className="grid gap-3 sm:grid-cols-2">
        <FlagCard
          flag="--fix"
          label="Auto-fix discrepancies"
          description="Resolve issues in .env.example, package catalog, and ports"
          checked={state.doctorFix}
          onCheckedChange={(doctorFix) => update({ doctorFix })}
        />
        <FlagCard
          flag="--verbose"
          label="Verbose diagnostics"
          description="Print detailed checks for Docker, Node, pnpm, and ports"
          checked={state.doctorVerbose}
          onCheckedChange={(doctorVerbose) => update({ doctorVerbose })}
        />
        <FlagCard
          flag="--json"
          label="Machine-readable output"
          description="Emit raw diagnostics payload for CI runners and scripts"
          checked={state.doctorJson}
          onCheckedChange={(doctorJson) => update({ doctorJson })}
        />
      </div>
    </BuilderSection>
  );
}
