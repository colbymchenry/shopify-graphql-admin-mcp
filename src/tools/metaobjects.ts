import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GraphQLClient } from "../graphql/client.js";

export function registerMetaobjectTools(
  server: McpServer,
  client: GraphQLClient
) {
  server.tool(
    "shopify_metaobject_definitions_list",
    "List all metaobject definitions (types) in the store",
    {},
    async () => {
      const result = await client.execute(
        `query {
          metaobjectDefinitions(first: 50) {
            nodes {
              id type name description
              fieldDefinitions { key name type { name } required }
              metaobjectsCount
            }
          }
        }`
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "shopify_metaobjects_list",
    "List metaobject entries of a given type",
    {
      type: z.string().describe('Metaobject type (e.g. "school", "conference")'),
      first: z.number().optional().describe("Number of entries to return (default 20)"),
      after: z.string().optional().describe("Cursor for pagination"),
    },
    async ({ type, first, after }) => {
      const variables: Record<string, unknown> = {
        type,
        first: first ?? 20,
      };
      if (after) variables.after = after;

      const result = await client.execute(
        `query ($type: String!, $first: Int!, $after: String) {
          metaobjects(type: $type, first: $first, after: $after) {
            edges {
              cursor
              node {
                id handle displayName type
                fields { key value }
                updatedAt
              }
            }
            pageInfo { hasNextPage endCursor }
          }
        }`,
        variables
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "shopify_metaobject_get",
    "Get a single metaobject by ID",
    {
      id: z.string().describe("Metaobject GID"),
    },
    async ({ id }) => {
      const result = await client.execute(
        `query ($id: ID!) {
          metaobject(id: $id) {
            id handle displayName type
            fields { key value type }
            updatedAt
          }
        }`,
        { id }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "shopify_metaobject_create",
    "Create a new metaobject entry",
    {
      type: z.string().describe('Metaobject type (e.g. "school")'),
      handle: z.string().optional().describe("URL-friendly handle"),
      fields: z
        .array(z.object({ key: z.string(), value: z.string() }))
        .describe("Array of field key-value pairs"),
    },
    async ({ type, handle, fields }) => {
      const metaobject: Record<string, unknown> = { type, fields };
      if (handle) metaobject.handle = handle;

      const result = await client.execute(
        `mutation ($metaobject: MetaobjectCreateInput!) {
          metaobjectCreate(metaobject: $metaobject) {
            metaobject { id handle displayName fields { key value } }
            userErrors { field message code }
          }
        }`,
        { metaobject }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "shopify_metaobject_update",
    "Update an existing metaobject entry",
    {
      id: z.string().describe("Metaobject GID"),
      handle: z.string().optional().describe("New handle"),
      fields: z
        .array(z.object({ key: z.string(), value: z.string() }))
        .describe("Array of field key-value pairs to update"),
    },
    async ({ id, handle, fields }) => {
      const metaobject: Record<string, unknown> = { fields };
      if (handle) metaobject.handle = handle;

      const result = await client.execute(
        `mutation ($id: ID!, $metaobject: MetaobjectUpdateInput!) {
          metaobjectUpdate(id: $id, metaobject: $metaobject) {
            metaobject { id handle displayName fields { key value } }
            userErrors { field message code }
          }
        }`,
        { id, metaobject }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "shopify_metaobject_delete",
    "Delete a metaobject entry",
    {
      id: z.string().describe("Metaobject GID to delete"),
    },
    async ({ id }) => {
      const result = await client.execute(
        `mutation ($id: ID!) {
          metaobjectDelete(id: $id) {
            deletedId
            userErrors { field message code }
          }
        }`,
        { id }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
