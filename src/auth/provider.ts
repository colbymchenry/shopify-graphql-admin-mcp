import type { Config } from "../utils/cli.js";

interface TokenState {
  token: string;
  expiresAt: number;
}

export class AuthProvider {
  private config: Config;
  private tokenState: TokenState | null = null;

  constructor(config: Config) {
    this.config = config;
  }

  async getAccessToken(): Promise<string> {
    if (this.config.auth.mode === "access-token") {
      return this.config.auth.accessToken;
    }

    if (this.tokenState && Date.now() < this.tokenState.expiresAt - 300_000) {
      return this.tokenState.token;
    }

    return this.fetchToken();
  }

  async forceRefresh(): Promise<string> {
    if (this.config.auth.mode === "access-token") {
      return this.config.auth.accessToken;
    }
    return this.fetchToken();
  }

  private async fetchToken(): Promise<string> {
    if (this.config.auth.mode !== "client-credentials") {
      throw new Error("Cannot fetch token in access-token mode");
    }

    const { clientId, clientSecret } = this.config.auth;

    const res = await fetch(
      `https://${this.config.store}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "client_credentials",
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `OAuth token exchange failed (${res.status}): ${text.slice(0, 200)}`
      );
    }

    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };

    this.tokenState = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return this.tokenState.token;
  }
}
