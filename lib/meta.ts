export function metaAuthUrl(params: { appId: string; redirectUri: string; state: string }) {
  const u = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  u.searchParams.set("client_id", params.appId);
  u.searchParams.set("redirect_uri", params.redirectUri);
  u.searchParams.set("state", params.state);
  u.searchParams.set("scope", "ads_read,business_management");
  return u.toString();
}

export async function exchangeMetaToken(params: {
  appId: string;
  appSecret: string;
  redirectUri: string;
  code: string;
}) {
  const u = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
  u.searchParams.set("client_id", params.appId);
  u.searchParams.set("client_secret", params.appSecret);
  u.searchParams.set("redirect_uri", params.redirectUri);
  u.searchParams.set("code", params.code);

  const resp = await fetch(u.toString());
  if (!resp.ok) throw new Error(`Meta token exchange failed: ${resp.status}`);
  return resp.json() as Promise<{ access_token: string; token_type: string; expires_in: number }>;
}

export async function metaGet<T>(path: string, accessToken: string, params?: Record<string, string>) {
  const u = new URL(`https://graph.facebook.com/v19.0/${path}`);
  u.searchParams.set("access_token", accessToken);
  if (params) for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);

  const resp = await fetch(u.toString());
  if (!resp.ok) throw new Error(`Meta API failed: ${resp.status}`);
  return resp.json() as Promise<T>;
}

export async function pickFirstAdAccount(accessToken: string) {
  const res = await metaGet<{ data: Array<{ id: string }> }>("me/adaccounts", accessToken, {
    fields: "id",
    limit: "50"
  });
  return res.data?.[0]?.id ?? null;
}

export async function getAdAccountCurrency(accessToken: string, adAccountId: string) {
  const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const res = await metaGet<{ currency?: string }>(id, accessToken, { fields: "currency" });
  return res.currency ?? "USD";
}

export async function fetchInsightsDailyAdset(params: {
  accessToken: string;
  adAccountId: string;
  days: number;
}) {
  type InsightsResponse = {
    data?: any[];
    paging?: {
      next?: string;
    };
  };

  const until = new Date();
  const since = new Date(Date.now() - params.days * 24 * 60 * 60 * 1000);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const id = params.adAccountId.startsWith("act_") ? params.adAccountId : `act_${params.adAccountId}`;

  let next: string | null = null;
  const rows: any[] = [];

  while (true) {
    const res: InsightsResponse = await metaGet<InsightsResponse>(next ? next : `${id}/insights`, params.accessToken, next
      ? undefined
      : {
          fields: "spend,campaign_id,campaign_name,adset_id,adset_name,date_start",
          level: "adset",
          time_increment: "1",
          limit: "5000",
          "time_range[since]": fmt(since),
          "time_range[until]": fmt(until)
        });

    rows.push(...(res.data ?? []));
    next = res.paging?.next ? res.paging.next.replace("https://graph.facebook.com/v19.0/", "") : null;
    if (!next) break;
  }

  return rows;
}
