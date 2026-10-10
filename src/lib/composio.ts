import { Composio } from "composio-core";
import { env } from "./env";

// Ensure we only create the client if the key exists to prevent crashing at startup if env is empty
export const getComposio = () => {
  if (!env.COMPOSIO_API_KEY) {
    throw new Error("COMPOSIO_API_KEY is missing");
  }
  return new Composio({
    apiKey: env.COMPOSIO_API_KEY,
  });
};
