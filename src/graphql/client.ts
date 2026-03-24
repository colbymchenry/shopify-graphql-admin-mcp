import type { AuthProvider } from "../auth/provider.js";
import type { Config } from "../utils/cli.js";

export interface GraphQLResponse {
  data?: Record<string, unknown>;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: Record<string, unknown>;
  }>;
  extensions?: Record<string, unknown>;
}

export class GraphQLClient {
  private auth: AuthProvider;
  private endpoint: string;

  constructor(auth: AuthProvider, config: Config) {
    this.auth = auth;
    this.endpoint = `https://${config.store}/admin/api/${config.apiVersion}/graphql.json`;
  }

  async execute(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<GraphQLResponse> {
    const token = await this.auth.getAccessToken();
    const body = JSON.stringify(
      variables ? { query, variables } : { query }
    );

    let res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body,
    });

    if (res.status === 401) {
      const refreshedToken = await this.auth.forceRefresh();
      res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": refreshedToken,
        },
        body,
      });
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Shopify API request failed (${res.status}): ${text.slice(0, 500)}`
      );
    }

    return (await res.json()) as GraphQLResponse;
  }
}
