import {
  buildDir,
  loadConfig,
  saveConfig,
  type RewindConfig,
} from "./config/config.js";
import { Requirement, Scene } from "./scenes/types.js";
import { scenes } from "./scenes/scenes.js";
import { createSnapshot, type SnapshotTask } from "./snapshot.js";
import {
  TautulliClient,
  type TautulliHistoryItem,
} from "./collectors/tautulli.js";
import { intro, outro, spinner } from "@clack/prompts";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import path from "node:path";
import { generateAssets } from "./assets.js";
import { generateTopMovies } from "./generate/topMovies.js";

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

async function requireSnapshotFile<T>(
  snapshotDir: string,
  service: string,
  method: string,
): Promise<TautulliHistoryItem[]> {
  const filePath = join(snapshotDir, service, `${method}.json`);
  try {
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data) as TautulliHistoryItem[];
  } catch (err) {
    throw new Error(
      `Failed to read snapshot file ${filePath}: ${(err as Error).message}`,
    );
  }
}

type SceneGenerator = (ctx: GenerationContext) => unknown;
const sceneGenerators: Partial<Record<Scene, SceneGenerator>> = {
  [Scene.TopMovies]: async (ctx) =>
    generateTopMovies(
      await requireSnapshotFile(
        path.join(buildDir(), ctx.config.id, "snapshot"),
        "tautulli",
        "getHistory",
      ),
      Number(ctx.user_id),
    ),
};

export async function buildRewind(
  ctx: GenerationContext,
): Promise<Record<string, unknown>> {
  const scenesData: Record<string, unknown> = {};

  const selectedScenes = resolveScenes(ctx.config.scenes);

  for (const scene of selectedScenes) {
    const generator = sceneGenerators[scene];

    if (!generator) {
      throw new Error(`No generator registered for scene "${scene}".`);
    }

    scenesData[scene] = await generator(ctx);
  }

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
    join(buildDir(), config.id, "snapshot/tautulli/getUsers.json"),
    "utf-8",
  )
    .then((data) => JSON.parse(data))
    .catch((err) => {
      throw new Error(`Failed to read users data: ${err.message}`);
    });

  // TODO: Update eligible users to include only those who have watched content in the specified time range.
  const eligibleUsers = users.filter((user: any) => user.is_active);
  console.log(eligibleUsers.map((user: any) => user.username));

  s.stop("✓ Finding eligible users");

  // TODO: Generate the rewind content based on the snapshot and eligible users.
  for (const user of eligibleUsers) {
    const rewindJson = await buildRewind({ config, user_id: user.user_id });

    const userDir = path.join(buildDir(), config.id, "users");
    await mkdir(userDir, { recursive: true });

    await writeFile(
      path.join(userDir, `${user.user_id}.json`),
      JSON.stringify(rewindJson, null, 2),
      "utf-8",
    );
  }

  // TODO: Download any needed assets and store them.
  await generateAssets(config.id, path.join(buildDir(), config.id));
}
