export type CheckStatus = "pass" | "warn" | "fail" | "skip";

export interface CheckResult {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
  remedy?: string;
  fixable?: boolean;
  fix?: () => Promise<string | void>;
}

export interface CheckGroup {
  name: string;
  title: string;
  checks: CheckResult[];
}

export interface DoctorOptions {
  cwd?: string;
  fix?: boolean;
  json?: boolean;
  verbose?: boolean;
}

export interface DoctorReport {
  projectRoot: string;
  groups: CheckGroup[];
  summary: {
    passed: number;
    warnings: number;
    errors: number;
    skipped: number;
    fixed: number;
  };
  healthy: boolean;
}
