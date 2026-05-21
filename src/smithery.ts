import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createNapkinMcpServer } from "./server.js";

export const configSchema = z.object({
  napkinApiKey: z.string().min(1).describe("Your Napkin AI API key"),
  napkinApiBaseUrl: z
    .string()
    .url()
    .optional()
    .describe("Custom Napkin AI API base URL (default: https://api.napkin.ai)"),
  pollingInterval: z
    .number()
    .int()
    .min(500)
    .max(30000)
    .optional()
    .default(2000)
    .describe("Polling interval in ms when waiting for generation (default: 2000)"),
  maxWaitTime: z
    .number()
    .int()
    .min(10000)
    .max(600000)
    .optional()
    .default(300000)
    .describe("Max wait time in ms for generation (default: 300000 = 5 minutes)"),
});

export default function ({
  config,
}: {
  config: z.infer<typeof configSchema>;
}): McpServer["server"] {
  const server = createNapkinMcpServer({
    napkinApiKey: config.napkinApiKey,
    napkinApiBaseUrl: config.napkinApiBaseUrl,
    pollingInterval: config.pollingInterval,
    maxWaitTime: config.maxWaitTime,
  });

  return server.server;
}
