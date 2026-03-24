import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GraphQLClient } from "../graphql/client.js";

export function registerProductTools(
  server: McpServer,
  client: GraphQLClient
) {
  server.tool(
    "shopify_products_list",
    "List products with optional search filter and pagination",
    {
      query: z.string().optional().describe("Search query to filter products"),
      first: z.number().optional().describe("Number of products to return (default 10)"),
      after: z.string().optional().describe("Cursor for pagination"),
    },
    async ({ query, first, after }) => {
      const variables: Record<string, unknown> = { first: first ?? 10 };
      if (query) variables.query = query;
      if (after) variables.after = after;

      const result = await client.execute(
        `query ($first: Int!, $query: String, $after: String) {
          products(first: $first, query: $query, after: $after) {
            edges {
              cursor
              node {
                id title handle status vendor productType
                totalInventory
                priceRangeV2 { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
                featuredImage { url altText }
                createdAt updatedAt
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
    "shopify_product_get",
    "Get a single product by ID",
    {
      id: z.string().describe("Product GID (e.g. gid://shopify/Product/123)"),
    },
    async ({ id }) => {
      const result = await client.execute(
        `query ($id: ID!) {
          product(id: $id) {
            id title handle descriptionHtml status vendor productType tags
            totalInventory
            priceRangeV2 { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
            featuredImage { url altText }
            variants(first: 50) {
              nodes { id title price sku inventoryQuantity selectedOptions { name value } }
            }
            metafields(first: 20) {
              nodes { namespace key value type }
            }
            createdAt updatedAt
          }
        }`,
        { id }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "shopify_product_create",
    "Create a new product",
    {
      title: z.string().describe("Product title"),
      descriptionHtml: z.string().optional().describe("Product description in HTML"),
      vendor: z.string().optional().describe("Product vendor"),
      productType: z.string().optional().describe("Product type"),
      tags: z.array(z.string()).optional().describe("Product tags"),
      status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).optional().describe("Product status"),
    },
    async (params) => {
      const input: Record<string, unknown> = { title: params.title };
      if (params.descriptionHtml) input.descriptionHtml = params.descriptionHtml;
      if (params.vendor) input.vendor = params.vendor;
      if (params.productType) input.productType = params.productType;
      if (params.tags) input.tags = params.tags;
      if (params.status) input.status = params.status;

      const result = await client.execute(
        `mutation ($input: ProductInput!) {
          productCreate(input: $input) {
            product { id title handle status }
            userErrors { field message }
          }
        }`,
        { input }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "shopify_product_update",
    "Update an existing product",
    {
      id: z.string().describe("Product GID"),
      title: z.string().optional().describe("Product title"),
      descriptionHtml: z.string().optional().describe("Product description in HTML"),
      vendor: z.string().optional().describe("Product vendor"),
      productType: z.string().optional().describe("Product type"),
      tags: z.array(z.string()).optional().describe("Product tags"),
      status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).optional().describe("Product status"),
    },
    async (params) => {
      const input: Record<string, unknown> = { id: params.id };
      if (params.title) input.title = params.title;
      if (params.descriptionHtml) input.descriptionHtml = params.descriptionHtml;
      if (params.vendor) input.vendor = params.vendor;
      if (params.productType) input.productType = params.productType;
      if (params.tags) input.tags = params.tags;
      if (params.status) input.status = params.status;

      const result = await client.execute(
        `mutation ($input: ProductInput!) {
          productUpdate(input: $input) {
            product { id title handle status }
            userErrors { field message }
          }
        }`,
        { input }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "shopify_product_delete",
    "Delete a product",
    {
      id: z.string().describe("Product GID to delete"),
    },
    async ({ id }) => {
      const result = await client.execute(
        `mutation ($input: ProductDeleteInput!) {
          productDelete(input: $input) {
            deletedProductId
            userErrors { field message }
          }
        }`,
        { input: { id } }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
