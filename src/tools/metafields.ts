import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GraphQLClient } from "../graphql/client.js";

export function registerMetafieldTools(
  server: McpServer,
  client: GraphQLClient
) {
  server.tool(
    "shopify_metafields_list",
    "List metafields on a specific resource (product, collection, customer, etc.)",
    {
      ownerId: z.string().describe("GID of the owner resource (e.g. gid://shopify/Product/123)"),
      namespace: z.string().optional().describe("Filter by namespace"),
      first: z.number().optional().describe("Number of metafields to return (default 20)"),
    },
    async ({ ownerId, namespace, first }) => {
      const variables: Record<string, unknown> = {
        ownerId,
        first: first ?? 20,
      };
      if (namespace) variables.namespace = namespace;

      const result = await client.execute(
        `query ($ownerId: ID!, $first: Int!, $namespace: String) {
          node(id: $ownerId) {
            ... on HasMetafields {
              metafields(first: $first, namespace: $namespace) {
                nodes { id namespace key value type updatedAt }
                pageInfo { hasNextPage endCursor }
              }
            }
          }
        }`,
        variables
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "shopify_metafields_set",
    "Set (upsert) one or more metafields on any resource",
    {
      metafields: z
        .array(
          z.object({
            ownerId: z.string().describe("GID of the owner resource"),
            namespace: z.string().describe("Metafield namespace"),
            key: z.string().describe("Metafield key"),
            value: z.string().describe("Metafield value (JSON string for complex types)"),
            type: z.string().describe("Metafield type (e.g. single_line_text_field, json, number_integer)"),
          })
        )
        .describe("Array of metafields to set"),
    },
    async ({ metafields }) => {
      const result = await client.execute(
        `mutation ($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields { id namespace key value type }
            userErrors { field message code }
          }
        }`,
        { metafields }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "shopify_metafield_delete",
    "Delete a metafield",
    {
      id: z.string().describe("Metafield GID to delete"),
    },
    async ({ id }) => {
      const result = await client.execute(
        `mutation ($input: MetafieldDeleteInput!) {
          metafieldDelete(input: $input) {
            deletedId
            userErrors { field message }
          }
        }`,
        { input: { id } }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
