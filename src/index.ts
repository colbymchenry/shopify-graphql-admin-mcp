#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { parseArgs } from "./utils/cli.js";
import { AuthProvider } from "./auth/provider.js";
import { GraphQLClient } from "./graphql/client.js";
import { runIntrospection } from "./graphql/introspection.js";
import { SchemaIndex } from "./graphql/schema-index.js";
import { createServer } from "./server.js";

async function main() {
  const config = parseArgs(process.argv);

  console.error(`Connecting to ${config.store} (API ${config.apiVersion})...`);

  const auth = new AuthProvider(config);

  // Validate credentials early
  try {
    await auth.getAccessToken();
  } catch (err) {
    console.error(
      `Authentication failed: ${err instanceof Error ? err.message : err}`
    );
    process.exit(1);
  }

  const client = new GraphQLClient(auth, config);

  console.error("Running schema introspection...");
  let schemaIndex: SchemaIndex;
  try {
    const schema = await runIntrospection(client);
    schemaIndex = new SchemaIndex(schema);
    console.error(
      `Schema loaded: ${schema.types.length} types`
    );
  } catch (err) {
    console.error(
      `Schema introspection failed: ${err instanceof Error ? err.message : err}`
    );
    process.exit(1);
  }

  const server = createServer(client, schemaIndex);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Shopify GraphQL Admin MCP Server running");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
