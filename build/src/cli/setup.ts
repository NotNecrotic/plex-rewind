import { spinner, cancel, intro, outro } from "@clack/prompts";
import { TautulliClient } from "../collectors/tautulli.js";

const banner = `
██████╗ ██╗     ███████╗██╗  ██╗    ██████╗ ███████╗██╗    ██╗██╗███╗   ██╗██████╗ 
██╔══██╗██║     ██╔════╝╚██╗██╔╝    ██╔══██╗██╔════╝██║    ██║██║████╗  ██║██╔══██╗
██████╔╝██║     █████╗   ╚███╔╝     ██████╔╝█████╗  ██║ █╗ ██║██║██╔██╗ ██║██║  ██║
██╔═══╝ ██║     ██╔══╝   ██╔██╗     ██╔══██╗██╔══╝  ██║███╗██║██║██║╚██╗██║██║  ██║
██║     ███████╗███████╗██╔╝ ██╗    ██║  ██║███████╗╚███╔███╔╝██║██║ ╚████║██████╔╝
╚═╝     ╚══════╝╚══════╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝╚═╝  ╚═══╝╚═════╝
`;

function exit(): never {
  cancel("Setup aborted.");
  process.exit(0);
}

export async function runSetup() {
  console.log(banner);
  intro("Connecting to API servers:");

  // Check connection to API servers
  const failed: string[] = [];
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
      failed.push(client.name);
    }
  }

  if (failed.length > 0) {
    outro(`Failed to connect to: ${failed.join(", ")}`);
    exit();
  } else {
    outro("All API servers reachable");
  }
}
