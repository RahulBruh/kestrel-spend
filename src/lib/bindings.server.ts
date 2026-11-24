// Server-only access to the Worker's bindings. `cloudflare:workers` is provided
// by the Workers runtime and is never bundled.
import { env } from "cloudflare:workers";
// Imported directly, not through tsconfig `types`, which would clobber the DOM
// globals the client code relies on.
import type { D1Database } from "@cloudflare/workers-types";

type AppEnv = { DB?: D1Database };

export function bindings(): AppEnv {
  return env as AppEnv;
}
