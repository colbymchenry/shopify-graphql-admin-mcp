import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GraphQLClient } from "../graphql/client.js";

export function registerOrderTools(
  server: McpServer,
  client: GraphQLClient
) {
  server.tool(
    "shopify_orders_list",
    "List orders with optional search filter and pagination",
    {
      query: z.string().optional().describe("Search query to filter orders"),
      first: z.number().optional().describe("Number of orders to return (default 10)"),
      after: z.string().optional().describe("Cursor for pagination"),
    },
    async ({ query, first, after }) => {
      const variables: Record<string, unknown> = { first: first ?? 10 };
      if (query) variables.query = query;
      if (after) variables.after = after;

      const result = await client.execute(
        `query ($first: Int!, $query: String, $after: String) {
          orders(first: $first, query: $query, after: $after) {
            edges {
              cursor
              node {
                id name displayFinancialStatus displayFulfillmentStatus
                totalPriceSet { shopMoney { amount currencyCode } }
                customer { id displayName email }
                lineItems(first: 5) {
                  nodes { title quantity }
                }
                createdAt
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
    "shopify_order_get",
    "Get a single order by ID",
    {
      id: z.string().describe("Order GID"),
    },
    async ({ id }) => {
      const result = await client.execute(
        `query ($id: ID!) {
          order(id: $id) {
            id name displayFinancialStatus displayFulfillmentStatus
            totalPriceSet { shopMoney { amount currencyCode } }
            subtotalPriceSet { shopMoney { amount currencyCode } }
            totalShippingPriceSet { shopMoney { amount currencyCode } }
            totalTaxSet { shopMoney { amount currencyCode } }
            customer { id displayName email phone }
            shippingAddress { address1 address2 city province country zip }
            lineItems(first: 50) {
              nodes {
                title quantity sku
                originalTotalSet { shopMoney { amount currencyCode } }
                variant { id title }
              }
            }
            fulfillments { status trackingInfo { number url } }
            tags note
            metafields(first: 10) {
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
}
