import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GraphQLClient } from "./graphql/client.js";
import type { SchemaIndex } from "./graphql/schema-index.js";
import { registerGraphQLProxy } from "./tools/graphql-proxy.js";
import { registerSchemaSearch } from "./tools/schema-search.js";
import { registerProductTools } from "./tools/products.js";
import { registerCollectionTools } from "./tools/collections.js";
import { registerMetaobjectTools } from "./tools/metaobjects.js";
import { registerMetafieldTools } from "./tools/metafields.js";
import { registerCustomerTools } from "./tools/customers.js";
import { registerOrderTools } from "./tools/orders.js";
import { registerInventoryTools } from "./tools/inventory.js";

export function createServer(
  client: GraphQLClient,
  schemaIndex: SchemaIndex
): McpServer {
  const server = new McpServer({
    name: "shopify-graphql-admin",
    version: "1.0.0",
  });

  registerGraphQLProxy(server, client);
  registerSchemaSearch(server, schemaIndex);
  registerProductTools(server, client);
  registerCollectionTools(server, client);
  registerMetaobjectTools(server, client);
  registerMetafieldTools(server, client);
  registerCustomerTools(server, client);
  registerOrderTools(server, client);
  registerInventoryTools(server, client);

  return server;
}
