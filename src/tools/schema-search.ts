import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { SchemaIndex } from "../graphql/schema-index.js";

export function registerSchemaSearch(
  server: McpServer,
  schemaIndex: SchemaIndex
) {
  server.tool(
    "shopify_schema_search",
    "Search the Shopify Admin GraphQL schema by keyword. Returns matching types, queries, and mutations. Use this to discover what's available before writing queries.",
    {
      query: z
        .string()
        .describe('Search keyword (e.g. "metaobject", "product", "collection")'),
      filter: z
        .enum(["all", "types", "queries", "mutations"])
        .optional()
        .describe("Filter results by category (default: all)"),
    },
    async ({ query, filter }) => {
      const results = schemaIndex.search(query, filter ?? "all");
      const lines: string[] = [];

      if (results.queries.length > 0) {
        lines.push("## Queries\n");
        for (const name of results.queries) {
          const q = schemaIndex.getQuery(name);
          if (q) lines.push(`- ${schemaIndex.formatFieldSummary(q)}`);
        }
        lines.push("");
      }

      if (results.mutations.length > 0) {
        lines.push("## Mutations\n");
        for (const name of results.mutations) {
          const m = schemaIndex.getMutation(name);
          if (m) lines.push(`- ${schemaIndex.formatFieldSummary(m)}`);
        }
        lines.push("");
      }

      if (results.types.length > 0) {
        lines.push("## Types\n");
        for (const name of results.types) {
          const t = schemaIndex.getType(name);
          if (t) {
            const desc = t.description
              ? ` — ${t.description.slice(0, 100)}`
              : "";
            lines.push(`- ${t.name} (${t.kind})${desc}`);
          }
        }
        lines.push("");
      }

      if (lines.length === 0) {
        lines.push(`No results found for "${query}".`);
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );

  server.tool(
    "shopify_schema_details",
    "Get complete details for a specific GraphQL type, query, or mutation including all fields, arguments, and nested types.",
    {
      name: z
        .string()
        .describe(
          'Exact name of the type, query, or mutation (e.g. "Product", "productCreate", "MetaobjectInput")'
        ),
    },
    async ({ name }) => {
      const details = schemaIndex.getDetails(name);
      if (!details) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No type, query, or mutation found with name "${name}". Use shopify_schema_search to find the correct name.`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: "text" as const, text: details }],
      };
    }
  );
}
