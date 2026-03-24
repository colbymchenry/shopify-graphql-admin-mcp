import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GraphQLClient } from "../graphql/client.js";

export function registerCustomerTools(
  server: McpServer,
  client: GraphQLClient
) {
  server.tool(
    "shopify_customers_list",
    "List customers with optional search filter and pagination",
    {
      query: z.string().optional().describe("Search query to filter customers"),
      first: z.number().optional().describe("Number of customers to return (default 10)"),
      after: z.string().optional().describe("Cursor for pagination"),
    },
    async ({ query, first, after }) => {
      const variables: Record<string, unknown> = { first: first ?? 10 };
      if (query) variables.query = query;
      if (after) variables.after = after;

      const result = await client.execute(
        `query ($first: Int!, $query: String, $after: String) {
          customers(first: $first, query: $query, after: $after) {
            edges {
              cursor
              node {
                id displayName email phone
                numberOfOrders
                amountSpent { amount currencyCode }
                tags
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
    "shopify_customer_get",
    "Get a single customer by ID",
    {
      id: z.string().describe("Customer GID"),
    },
    async ({ id }) => {
      const result = await client.execute(
        `query ($id: ID!) {
          customer(id: $id) {
            id displayName firstName lastName email phone
            numberOfOrders
            amountSpent { amount currencyCode }
            tags note
            addresses { address1 address2 city province country zip }
            orders(first: 10) {
              nodes { id name totalPriceSet { shopMoney { amount currencyCode } } createdAt }
            }
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

  server.tool(
    "shopify_customer_update",
    "Update a customer",
    {
      id: z.string().describe("Customer GID"),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      tags: z.array(z.string()).optional(),
      note: z.string().optional(),
    },
    async (params) => {
      const input: Record<string, unknown> = { id: params.id };
      if (params.firstName) input.firstName = params.firstName;
      if (params.lastName) input.lastName = params.lastName;
      if (params.email) input.email = params.email;
      if (params.phone) input.phone = params.phone;
      if (params.tags) input.tags = params.tags;
      if (params.note) input.note = params.note;

      const result = await client.execute(
        `mutation ($input: CustomerInput!) {
          customerUpdate(input: $input) {
            customer { id displayName email }
            userErrors { field message }
          }
        }`,
        { input }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
