import {
  buildDir,
  loadConfig,
  saveConfig,
  type RewindConfig,
} from "./config/config.js";
import { Requirement, type Scene } from "./scenes/types.js";
import { scenes } from "./scenes/scenes.js";
import { createSnapshot, type SnapshotTask } from "./snapshot.js";
import { TautulliClient } from "./collectors/tautulli.js";
import { intro, outro, spinner } from "@clack/prompts";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const collectors = [{ name: "tautulli", action: () => new TautulliClient() }];

export interface GenerationContext {
  config: RewindConfig;
  user_id: string;
}

function resolveScenes(sceneStrings: string[]): Scene[] {
  const known = new Set<string>(scenes.map((def) => def.id));

  return sceneStrings.map((sceneId) => {
    return sceneId as Scene;
  });
}

function resolveRequirements(sceneStrings: string[]): string[] {
  const requirementSet = new Set<Requirement>();

  for (const sceneString of sceneStrings) {
    const definition = scenes.find((def) => def.id === sceneString);

    if (definition?.requirements) {
      for (const req of definition.requirements) {
        requirementSet.add(req);
      }
    }
  }

  // Users are always required in order to generate the rewind
  requirementSet.add(Requirement.TautulliGetUsers);

  return Array.from(requirementSet).map((req) => `${req}()`);
}

export function createTasks(methods: string[]): SnapshotTask[] {
  const clientCache: Record<string, any> = {};

  return methods.map((methodStr) => {
    const normalized = methodStr.replace(/\(\)$/, "");
    const [serviceName, methodName] = normalized.split(".");

    if (!serviceName || !methodName) {
      throw new Error(
        `Invalid method format: "${methodStr}". Expected format "service.method".`,
      );
    }

    const id = `${serviceName}.${methodName}`;

    // Collector output is stored under a per-service subfolder:
    // snapshot/<service>/<method>.json
    const output = `${serviceName}/${methodName}.json`;

    return {
      id,
      output,
      execute: async () => {
        if (!clientCache[serviceName]) {
          const collector = collectors.find((c) => c.name === serviceName);
          if (!collector) {
            throw new Error(
              `Collector for service '${serviceName}' not found.`,
            );
          }
          clientCache[serviceName] = collector.action();
        }

        const client = clientCache[serviceName];
        if (typeof client[methodName] !== "function") {
          throw new Error(
            `Method ${methodName} not found on client '${serviceName}'.`,
          );
        }

        return await client[methodName]();
      },
    };
  });
}

export function buildRewind(
  ctx: GenerationContext,
  selectedScenes: Scene[],
): Record<string, unknown> {
  const scenesData: Record<string, unknown> = {};

  return {
    rewind: {
      id: ctx.config.id,
      year: ctx.config.year,
      title: ctx.config.title,
      liveDate: ctx.config.liveDate,
      serverName: ctx.config.serverName ?? null,
    },
    scenes: scenesData,
  };
}

export async function generateRewind(id: string): Promise<void> {
  const config = await loadConfig(id);

  if (config === null) {
    throw new Error(`Rewind config not found: ${id}`);
  }

  const selectedScenes = resolveScenes(config.scenes);
  const methods = resolveRequirements(selectedScenes);
  const tasks = createTasks(methods);

  intro(`Generating ${config.id} Rewind:`);

  const s = spinner();

  // Create snapshot
  s.start("Creating snapshot");

  const snapshot = await createSnapshot({
    id: config.id,
    tasks,
    buildDir: buildDir(),
  });

  s.stop("✓ Creating snapshot");

  // Determine eligible users
  s.start("Finding eligible users");

  const users = await readFile(
    join(buildDir(), "tautulli/getUsers.json"),
    "utf-8",
  )
    .then((data) => JSON.parse(data))
    .catch((err) => {
      throw new Error(`Failed to read users data: ${err.message}`);
    });

  // TODO: Update eligible users to include only those who have watched content in the specified time range.
  const eligibleUsers = users.filter((user: any) => user.is_active);

  s.stop("✓ Finding eligible users");

  // TODO: Generate the rewind content based on the snapshot and eligible users.
  // TODO: Download any needed assets and store them.
}
