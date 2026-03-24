import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GraphQLClient } from "../graphql/client.js";

export function registerGraphQLProxy(
  server: McpServer,
  client: GraphQLClient
) {
  server.tool(
    "shopify_graphql",
    "Execute a raw GraphQL query or mutation against the Shopify Admin API. Use shopify_schema_search to discover available queries, mutations, and types first.",
    {
      query: z.string().describe("The GraphQL query or mutation string"),
      variables: z
        .record(z.unknown())
        .optional()
        .describe("Optional variables object for the query"),
    },
    async ({ query, variables }) => {
      try {
        const result = await client.execute(query, variables);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
