import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GraphQLClient } from "../graphql/client.js";

export function registerCollectionTools(
  server: McpServer,
  client: GraphQLClient
) {
  server.tool(
    "shopify_collections_list",
    "List collections with optional search filter and pagination",
    {
      query: z.string().optional().describe("Search query to filter collections"),
      first: z.number().optional().describe("Number of collections to return (default 10)"),
      after: z.string().optional().describe("Cursor for pagination"),
    },
    async ({ query, first, after }) => {
      const variables: Record<string, unknown> = { first: first ?? 10 };
      if (query) variables.query = query;
      if (after) variables.after = after;

      const result = await client.execute(
        `query ($first: Int!, $query: String, $after: String) {
          collections(first: $first, query: $query, after: $after) {
            edges {
              cursor
              node {
                id title handle description productsCount { count }
                ruleSet { rules { column relation condition } }
                image { url altText }
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
    "shopify_collection_get",
    "Get a single collection by ID with its products",
    {
      id: z.string().describe("Collection GID"),
      productsFirst: z.number().optional().describe("Number of products to include (default 10)"),
    },
    async ({ id, productsFirst }) => {
      const result = await client.execute(
        `query ($id: ID!, $productsFirst: Int!) {
          collection(id: $id) {
            id title handle description descriptionHtml
            productsCount { count }
            ruleSet { appliedDisjunctively rules { column relation condition } }
            image { url altText }
            products(first: $productsFirst) {
              nodes { id title handle status }
              pageInfo { hasNextPage endCursor }
            }
            metafields(first: 10) {
              nodes { namespace key value type }
            }
            updatedAt
          }
        }`,
        { id, productsFirst: productsFirst ?? 10 }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "shopify_collection_create",
    "Create a new collection",
    {
      title: z.string().describe("Collection title"),
      descriptionHtml: z.string().optional().describe("Collection description in HTML"),
      ruleSet: z
        .object({
          appliedDisjunctively: z.boolean(),
          rules: z.array(
            z.object({
              column: z.string(),
              relation: z.string(),
              condition: z.string(),
            })
          ),
        })
        .optional()
        .describe("Smart collection rules"),
    },
    async (params) => {
      const input: Record<string, unknown> = { title: params.title };
      if (params.descriptionHtml) input.descriptionHtml = params.descriptionHtml;
      if (params.ruleSet) input.ruleSet = params.ruleSet;

      const result = await client.execute(
        `mutation ($input: CollectionInput!) {
          collectionCreate(input: $input) {
            collection { id title handle }
            userErrors { field message }
          }
        }`,
        { input }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "shopify_collection_update",
    "Update an existing collection",
    {
      id: z.string().describe("Collection GID"),
      title: z.string().optional().describe("Collection title"),
      descriptionHtml: z.string().optional().describe("Collection description in HTML"),
    },
    async (params) => {
      const input: Record<string, unknown> = { id: params.id };
      if (params.title) input.title = params.title;
      if (params.descriptionHtml) input.descriptionHtml = params.descriptionHtml;

      const result = await client.execute(
        `mutation ($input: CollectionInput!) {
          collectionUpdate(input: $input) {
            collection { id title handle }
            userErrors { field message }
          }
        }`,
        { input }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "shopify_collection_delete",
    "Delete a collection",
    {
      id: z.string().describe("Collection GID to delete"),
    },
    async ({ id }) => {
      const result = await client.execute(
        `mutation ($input: CollectionDeleteInput!) {
          collectionDelete(input: $input) {
            deletedCollectionId
            userErrors { field message }
          }
        }`,
        { input: { id } }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
