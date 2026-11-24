"use client";

import type { BuilderState } from "../command-builder";
import { BuilderSection, FlagCard } from "./builder-primitives";

export function UpgradeControls({
  state,
  update,
}: {
  state: BuilderState;
  update: (patch: Partial<BuilderState>) => void;
}) {
  return (
    <BuilderSection title="Template upgrade options">
      <div className="grid gap-3 sm:grid-cols-2">
        <FlagCard
          flag="--commit"
          label="Git commit"
          description="Automatically commit template changes after upgrade"
          checked={state.upgradeCommit}
          onCheckedChange={(upgradeCommit) => update({ upgradeCommit })}
        />
        <FlagCard
          flag="--dry-run"
          label="Dry run"
          description="Inspect template diffs without writing files to disk"
          checked={state.upgradeDryRun}
          onCheckedChange={(upgradeDryRun) => update({ upgradeDryRun })}
        />
        <FlagCard
          flag="--force"
          label="Force upgrade"
          description="Bypass conflict checks and force template overwrite"
          checked={state.upgradeForce}
          onCheckedChange={(upgradeForce) => update({ upgradeForce })}
        />
        <FlagCard
          flag="--verbose"
          label="Verbose logging"
          description="Show granular file copy and patch decisions"
          checked={state.upgradeVerbose}
          onCheckedChange={(upgradeVerbose) => update({ upgradeVerbose })}
        />
      </div>
    </BuilderSection>
  );
}
