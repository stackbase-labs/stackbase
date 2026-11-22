import { access, readFile, writeFile } from "node:fs/promises";
import yaml from "yaml";

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

export interface ServiceMergeResult {
  changed: boolean;
  serviceAdded?: string;
}

/**
 * Merges a service from a template docker-compose into the target docker-compose.yml
 * if the target exists and the service is not yet defined.
 */
export const mergeDockerComposeService = async (
  targetComposePath: string,
  serviceName: string,
  serviceDefinition: unknown,
  volumeDefinitions?: Record<string, unknown>,
): Promise<ServiceMergeResult> => {
  if (!(await fileExists(targetComposePath))) {
    return { changed: false };
  }

  try {
    const content = await readFile(targetComposePath, "utf8");
    const doc = yaml.parse(content) as {
      services?: Record<string, unknown>;
      volumes?: Record<string, unknown>;
      [key: string]: unknown;
    };

    if (!doc || typeof doc !== "object") {
      return { changed: false };
    }

    if (!doc.services) {
      doc.services = {};
    }

    // If the service is already defined, don't overwrite
    if (doc.services[serviceName]) {
      return { changed: false };
    }

    doc.services[serviceName] = serviceDefinition;

    if (volumeDefinitions) {
      if (!doc.volumes) {
        doc.volumes = {};
      }
      for (const [volName, volDef] of Object.entries(volumeDefinitions)) {
        if (!doc.volumes[volName]) {
          doc.volumes[volName] = volDef;
        }
      }
    }

    await writeFile(targetComposePath, yaml.stringify(doc));
    return { changed: true, serviceAdded: serviceName };
  } catch {
    return { changed: false };
  }
};
