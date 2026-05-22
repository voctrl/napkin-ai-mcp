import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createNapkinMcpServer } from "./server.js";
import { StorageConfig } from "./storage/index.js";

export const configSchema = z.object({
  napkinApiKey: z.string().min(1).describe("Your Napkin AI API key from https://app.napkin.ai"),
  napkinApiBaseUrl: z
    .string()
    .url()
    .optional()
    .describe("Custom Napkin AI API base URL (leave empty to use default)"),
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
  s3Bucket: z.string().optional().describe("S3 bucket name. Enables S3 storage when set."),
  s3Region: z.string().optional().describe("AWS region for the S3 bucket (e.g. us-east-1)"),
  s3Prefix: z.string().optional().describe("Optional path prefix for stored objects"),
  s3Endpoint: z
    .string()
    .optional()
    .describe("Custom endpoint for S3-compatible storage (e.g. Cloudflare R2, MinIO)"),
  awsAccessKeyId: z.string().optional().describe("AWS access key ID for S3 authentication"),
  awsSecretAccessKey: z.string().optional().describe("AWS secret access key for S3 authentication"),
  s3ForcePathStyle: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Force path-style URLs — required for Cloudflare R2, MinIO, and other S3-compatible services"
    ),
});

export default function ({
  config,
}: {
  config: z.infer<typeof configSchema>;
}): McpServer["server"] {
  let storage: StorageConfig | undefined;

  if (config.s3Bucket && config.s3Region) {
    storage = {
      type: "s3",
      bucket: config.s3Bucket,
      region: config.s3Region,
      prefix: config.s3Prefix,
      endpoint: config.s3Endpoint,
      accessKeyId: config.awsAccessKeyId,
      secretAccessKey: config.awsSecretAccessKey,
      forcePathStyle: config.s3ForcePathStyle,
    };
  }

  const server = createNapkinMcpServer({
    napkinApiKey: config.napkinApiKey,
    napkinApiBaseUrl: config.napkinApiBaseUrl,
    pollingInterval: config.pollingInterval,
    maxWaitTime: config.maxWaitTime,
    storage,
  });

  return server.server;
}
