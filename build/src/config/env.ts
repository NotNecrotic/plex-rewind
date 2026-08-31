import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  TAUTULLI_URL: z.url(),
  TAUTULLI_API_KEY: z.string().length(32),
  BUILD_DIR: z.string().min(1).default("./builds"),
});

let config: z.infer<typeof schema>;

config = schema.parse(process.env);

export { config };
