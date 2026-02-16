import crypto from "crypto";

export function verifyShopifyHmac(query: Record<string, string>, secret: string) {
  const { hmac, ...rest } = query;
  if (!hmac) return false;

  const message = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("&");

  const digest = crypto.createHmac("sha256", secret).update(message).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
}

export function shopifyAuthUrl(params: {
  shop: string;
  clientId: string;
  scopes: string;
  redirectUri: string;
  state: string;
}) {
  const { shop, clientId, scopes, redirectUri, state } = params;
  const u = new URL(`https://${shop}/admin/oauth/authorize`);
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("scope", scopes);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("state", state);
  return u.toString();
}

export async function exchangeShopifyToken(params: {
  shop: string;
  clientId: string;
  clientSecret: string;
  code: string;
}) {
  const { shop, clientId, clientSecret, code } = params;
  const resp = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code
    })
  });

  if (!resp.ok) throw new Error(`Shopify token exchange failed: ${resp.status}`);
  return resp.json() as Promise<{ access_token: string; scope: string }>;
}

function parseLinkHeader(link: string | null) {
  if (!link) return null;
  const parts = link.split(",").map((p) => p.trim());
  for (const p of parts) {
    const m = p.match(/<([^>]+)>;\s*rel="next"/);
    if (m) return m[1];
  }
  return null;
}

export async function fetchShopifyOrders(params: {
  shop: string;
  accessToken: string;
  days: number;
}) {
  const { shop, accessToken, days } = params;
  const createdAtMin = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let url = new URL(`https://${shop}/admin/api/2024-10/orders.json`);
  url.searchParams.set("status", "any");
  url.searchParams.set("limit", "250");
  url.searchParams.set("created_at_min", createdAtMin);

  const out: any[] = [];

  while (true) {
    const resp = await fetch(url.toString(), {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "content-type": "application/json"
      }
    });

    if (!resp.ok) throw new Error(`Shopify orders fetch failed: ${resp.status}`);
    const json = (await resp.json()) as { orders: any[] };
    out.push(...(json.orders ?? []));

    const nextUrl = parseLinkHeader(resp.headers.get("link"));
    if (!nextUrl) break;
    url = new URL(nextUrl);
  }

  return out;
}

export function computeOrderMoney(order: any) {
  const gross = Number(order?.total_price ?? 0);
  const discounts = Number(order?.total_discounts ?? 0);

  let refunds = 0;
  const refundsArr = Array.isArray(order?.refunds) ? order.refunds : [];
  for (const r of refundsArr) {
    const tx = Array.isArray(r?.transactions) ? r.transactions : [];
    for (const t of tx) {
      if (t?.kind === "refund") refunds += Number(t?.amount ?? 0);
    }
  }

  const net = gross - discounts - refunds;
  const currency = String(order?.currency ?? "EGP");
  const createdAt = String(order?.created_at);

  return { gross, discounts, refunds, net, currency, createdAt };
}
