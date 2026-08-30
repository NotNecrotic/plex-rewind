import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  TAUTULLI_URL: z.url(),
  TAUTULLI_API_KEY: z.string().length(32),
});

let config: z.infer<typeof schema>;

try {
  config = schema.parse(process.env);
} catch (error) {
  console.error(error);
}

export { config };
