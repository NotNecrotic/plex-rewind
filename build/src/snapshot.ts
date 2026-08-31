import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export interface SnapshotTask {
  id: string;
  output: string;
  execute: () => Promise<unknown>; // Function that performs the actual collection.
}

export interface SnapshotOptions {
  id: string; // Also used as the output folder name.
  tasks: SnapshotTask[];
  buildDir: string;
}

export interface SnapshotResult {
  id: string;
  path: string;
  completedTasks: number;
  createdAt: Date;
}

export async function createSnapshot(
  options: SnapshotOptions,
): Promise<SnapshotResult> {
  const { id, tasks, buildDir } = options;

  if (!id.trim()) {
    throw new Error("Snapshot ID is empty");
  }

  if (tasks.length === 0) {
    throw new Error("Snapshot contains no collection tasks");
  }

  const rewindDir = path.resolve(buildDir, id);
  const snapshotDir = path.resolve(rewindDir, "snapshot");

  await rm(snapshotDir, {
    recursive: true,
    force: true,
  });

  await mkdir(snapshotDir, {
    recursive: true,
  });

  let completedTasks = 0;

  try {
    for (const task of tasks) {
      //console.log(`Collecting ${task.id}...`);

      try {
        const data = await task.execute();

        const dataPath = path.resolve(snapshotDir, task.output);

        await mkdir(path.dirname(dataPath), {
          recursive: true,
        });

        await writeFile(dataPath, JSON.stringify(data, null, 2), "utf-8");

        completedTasks++;

        //console.log(`  ✓ ${task.output}`);
      } catch (error) {
        console.error(`  ✗ ${task.id}`);
        throw error;
      }
    }

    //console.log("");
    //console.log("✓ Snapshot complete");
    //console.log("");
    //console.log(`Snapshot: ${snapshotDir}`);
    //console.log(`Tasks:    ${completedTasks}/${tasks.length}`);
    //console.log("");

    return {
      id,
      path: snapshotDir,
      completedTasks,
      createdAt: new Date(),
    };
  } catch (error) {
    // Remove incomplete snapshot.
    await rm(snapshotDir, {
      recursive: true,
      force: true,
    });

    console.error("");
    console.error("✗ Snapshot failed.");
    console.error("");

    throw error;
  }
}
