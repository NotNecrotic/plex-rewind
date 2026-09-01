import {
  spinner,
  cancel,
  isCancel,
  intro,
  outro,
  text,
  multiselect,
} from "@clack/prompts";
import { TautulliClient } from "../collectors/tautulli.js";
import { type RewindConfig, saveConfig } from "../config/config.js";
import { scenes } from "../scenes/scenes.js";
import { generateRewind } from "../generateRewind.js";

const banner = `
██████╗ ██╗     ███████╗██╗  ██╗    ██████╗ ███████╗██╗    ██╗██╗███╗   ██╗██████╗ 
██╔══██╗██║     ██╔════╝╚██╗██╔╝    ██╔══██╗██╔════╝██║    ██║██║████╗  ██║██╔══██╗
██████╔╝██║     █████╗   ╚███╔╝     ██████╔╝█████╗  ██║ █╗ ██║██║██╔██╗ ██║██║  ██║
██╔═══╝ ██║     ██╔══╝   ██╔██╗     ██╔══██╗██╔══╝  ██║███╗██║██║██║╚██╗██║██║  ██║
██║     ███████╗███████╗██╔╝ ██╗    ██║  ██║███████╗╚███╔███╔╝██║██║ ╚████║██████╔╝
╚═╝     ╚══════╝╚══════╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝╚═╝  ╚═══╝╚═════╝
`;

function exit(): never {
  cancel("Build aborted.");
  process.exit(0);
}

export async function runSetup() {
  console.log(banner);
  intro("Connecting to API servers:");

  // Check connection to API servers
  let failed: boolean = false;
  const s = spinner();

  const clients = [
    { name: "Tautulli", action: () => new TautulliClient().getServerStatus() },
  ];

  for (const client of clients) {
    s.start(client.name);
    try {
      await client.action();
      s.stop(`✓ ${client.name}`);
    } catch (error) {
      s.stop(`✗ ${client.name}`);
      console.log(error);
      failed = true;
    }
  }

  if (failed) {
    outro(`✗`);
    exit();
  } else {
    outro("✓");
  }

  intro("Setup:");

  // Prompt for the rewind year
  const currentYear = new Date().getFullYear();
  const yearValue = await text({
    message: "Which year is this rewind for?",
    initialValue: currentYear.toString(),
    validate: (value) => {
      const n = Number(value);

      if (!Number.isInteger(n) || n < 2007 || n > currentYear) {
        return `Enter a valid year between 2007 and ${currentYear}.`;
      }
    },
  });

  if (isCancel(yearValue)) exit();

  const year = Number(yearValue);

  // Prompt for the title
  const title = await text({
    message: "What is the rewind's title?",
    initialValue: `Your ${year} Rewind`,
  });

  if (isCancel(title)) exit();

  // Prompt for the data collection start
  const startDateInput = await text({
    message: "What date should this rewind's data start from (YYYY-MM-DD)?",
    initialValue: `${year}-01-01`,
    validate: (value) => {
      if (value === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return "Enter a valid date (YYYY-MM-DD).";
      }

      const date = new Date(`${value}T00:00:00`);

      if (Number.isNaN(date.getTime())) {
        return "Enter a valid date (YYYY-MM-DD).";
      }

      if (date.getFullYear() !== year) {
        return `Date must be within ${year}.`;
      }
    },
  });

  if (isCancel(startDateInput)) exit();

  const startDate = new Date(startDateInput);

  // Prompt for the data collection cutoff
  const endDateInput = await text({
    message: "What date should this rewind's data end at (YYYY-MM-DD)?",
    initialValue: `${year}-12-31`,
    validate: (value) => {
      if (value === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return "Enter a valid date (YYYY-MM-DD).";
      }

      const date = new Date(`${value}T00:00:00`);

      if (Number.isNaN(date.getTime())) {
        return "Enter a valid date (YYYY-MM-DD).";
      }

      if (date.getFullYear() !== year) {
        return `Date must be within ${year}.`;
      }
    },
  });

  if (isCancel(endDateInput)) exit();

  const endDate = new Date(endDateInput);

  // Prompt for the release date
  const defaultLiveDate = new Date(endDate);
  defaultLiveDate.setDate(defaultLiveDate.getDate() + 1);

  const liveDateInput = await text({
    message: "When should the rewind go live (YYYY-MM-DD)?",
    initialValue: defaultLiveDate.toISOString().split("T")[0]!,
    validate: (value) => {
      if (value === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return "Enter a valid date (YYYY-MM-DD).";
      }

      const date = new Date(`${value}T00:00:00`);

      if (Number.isNaN(date.getTime())) {
        return "Enter a valid date (YYYY-MM-DD).";
      }

      if (date <= endDate) {
        return "Go-live date must be after the data end date.";
      }
    },
  });

  if (isCancel(liveDateInput)) exit();

  const liveDate = new Date(`${liveDateInput}T00:00:00`);

  //Prompt for selecting the rewind's scenes
  const chosenScenes = await multiselect({
    message: "Which scenes should be included in this rewind?",
    options: scenes.map((scene) => {
      const option: { value: string; label: string; hint?: string } = {
        value: scene.id,
        label: scene.name,
      };
      if (scene.description) {
        option.hint = scene.description;
      }
      return option;
    }),
    required: true,
  });

  outro();

  if (isCancel(chosenScenes)) exit();

  // Get Plex server name
  s.start("Getting Media Server Name");
  const tautulli = new TautulliClient();
  const serverInfo = await tautulli.getServerInfo();
  const serverName = serverInfo.pms_name;
  s.stop("✓ Getting Media Server Name");

  const rewindConfig: RewindConfig = {
    id: String(year),
    year,
    title: title,
    scenes: chosenScenes,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    liveDate: liveDate.toISOString(),
    serverName: serverName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveConfig(rewindConfig, String(year));

  generateRewind(year.toString());
}
