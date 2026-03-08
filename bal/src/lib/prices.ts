import { mockTokens } from "@/lib/mock-data";

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function getTokenPrices(mints: string[]) {
  const uniqueMints = [...new Set(mints.filter(Boolean))];
  if (!uniqueMints.length) {
    return {} as Record<string, number>;
  }

  try {
    const response = await fetch(`https://api.jup.ag/price/v2?ids=${uniqueMints.join(",")}`, {
      headers: {
        Accept: "application/json"
      },
      next: {
        revalidate: 30
      }
    });

    if (!response.ok) {
      throw new Error(`Jupiter price request failed: ${response.status}`);
    }

    const payload = (await response.json()) as { data?: Record<string, { price?: number | string }> };
    const entries = Object.entries(payload.data ?? {});
    if (!entries.length) {
      throw new Error("Jupiter returned no price data.");
    }

    return Object.fromEntries(entries.map(([mint, value]) => [mint, readNumber(value.price)]));
  } catch (error) {
    console.error("getTokenPrices fallback", error);
    const fallback = new Map(mockTokens.map((token) => [token.mint, token.priceUsd]));
    return Object.fromEntries(uniqueMints.map((mint) => [mint, fallback.get(mint) ?? 0]));
  }
}

