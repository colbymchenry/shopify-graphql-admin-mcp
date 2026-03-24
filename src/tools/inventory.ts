import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GraphQLClient } from "../graphql/client.js";

export function registerInventoryTools(
  server: McpServer,
  client: GraphQLClient
) {
  server.tool(
    "shopify_inventory_get_levels",
    "Get inventory levels for an inventory item across all locations",
    {
      inventoryItemId: z.string().describe("Inventory item GID"),
    },
    async ({ inventoryItemId }) => {
      const result = await client.execute(
        `query ($id: ID!) {
          inventoryItem(id: $id) {
            id sku
            inventoryLevels(first: 20) {
              nodes {
                id
                quantities(names: ["available", "committed", "incoming", "on_hand"]) {
                  name quantity
                }
                location { id name }
              }
            }
          }
        }`,
        { id: inventoryItemId }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "shopify_inventory_adjust",
    "Adjust inventory quantity at a specific location",
    {
      inventoryItemId: z.string().describe("Inventory item GID"),
      locationId: z.string().describe("Location GID"),
      delta: z.number().describe("Quantity change (positive to add, negative to remove)"),
    },
    async ({ inventoryItemId, locationId, delta }) => {
      const result = await client.execute(
        `mutation ($input: InventoryAdjustQuantitiesInput!) {
          inventoryAdjustQuantities(input: $input) {
            inventoryAdjustmentGroup {
              reason
              changes {
                name
                delta
                quantityAfterChange
              }
            }
            userErrors { field message code }
          }
        }`,
        {
          input: {
            reason: "correction",
            name: "available",
            changes: [
              {
                inventoryItemId,
                locationId,
                delta,
              },
            ],
          },
        }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
