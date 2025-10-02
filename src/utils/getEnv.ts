import dotenv from "dotenv";

dotenv.config({ quiet: true });

export function getEnvWithDefault(env: string, defaultEnv: string): string {
  return process.env[env] ?? defaultEnv;
}
