#!/usr/bin/env node
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { loadConfig } from "./config.js";
import { createNapkinMcpServer } from "./server.js";
import { StorageConfig } from "./storage/index.js";

const port = parseInt(process.env.PORT ?? "3000", 10);

const rawConfig = loadConfig();
const serverConfig = {
  napkinApiKey: rawConfig.napkinApiKey,
  napkinApiBaseUrl: rawConfig.napkinApiBaseUrl,
  pollingInterval: rawConfig.pollingInterval,
  maxWaitTime: rawConfig.maxWaitTime,
  defaults: rawConfig.defaults,
  ...(rawConfig.storage ? { storage: rawConfig.storage as StorageConfig } : {}),
};

// Stateless: new transport + server per request, no session tracking needed
async function handleMcp(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  const mcpServer = createNapkinMcpServer(serverConfig);
  await mcpServer.connect(transport);
  await transport.handleRequest(req, res);
}

const httpServer = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  if (req.url === "/mcp" || req.url === "/") {
    await handleMcp(req, res);
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

httpServer.listen(port, () => {
  console.log(`Napkin AI MCP server running on port ${port}`);
  console.log(`MCP endpoint: http://localhost:${port}/mcp`);
});
