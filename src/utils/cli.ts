export interface Config {
  store: string;
  apiVersion: string;
  auth:
    | { mode: "access-token"; accessToken: string }
    | { mode: "client-credentials"; clientId: string; clientSecret: string };
}

function getArg(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

export function parseArgs(argv: string[]): Config {
  const store = getArg(argv, "--store") ?? process.env.SHOPIFY_STORE;
  const accessToken =
    getArg(argv, "--access-token") ?? process.env.SHOPIFY_ACCESS_TOKEN;
  const clientId =
    getArg(argv, "--client-id") ??
    getArg(argv, "--clientId") ??
    process.env.SHOPIFY_CLIENT_ID;
  const clientSecret =
    getArg(argv, "--client-secret") ??
    getArg(argv, "--clientSecret") ??
    process.env.SHOPIFY_CLIENT_SECRET;
  const apiVersion =
    getArg(argv, "--api-version") ??
    process.env.SHOPIFY_API_VERSION ??
    "2025-01";

  if (!store) {
    console.error(
      "Error: --store is required (e.g. --store mystore.myshopify.com)"
    );
    process.exit(1);
  }

  const normalizedStore = store.includes(".myshopify.com")
    ? store
    : `${store}.myshopify.com`;

  if (accessToken) {
    return {
      store: normalizedStore,
      apiVersion,
      auth: { mode: "access-token", accessToken },
    };
  }

  if (clientId && clientSecret) {
    return {
      store: normalizedStore,
      apiVersion,
      auth: { mode: "client-credentials", clientId, clientSecret },
    };
  }

  console.error(
    "Error: Provide either --access-token or both --client-id and --client-secret"
  );
  process.exit(1);
}
