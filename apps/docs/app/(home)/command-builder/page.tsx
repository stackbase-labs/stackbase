import type { Metadata } from "next";

import { CommandBuilder } from "./_components/command-builder";

export const metadata: Metadata = {
  title: "Command Builder",
  description:
    "Configure a Stackbase project and generate the matching CLI command.",
};

export default function CommandBuilderPage() {
  return <CommandBuilder />;
}
