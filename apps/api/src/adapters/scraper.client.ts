const gotScrapingPromise = new Function("return import('got-scraping')")().then((m: any) => m.gotScraping);
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function parseScraperKeys(): string[] {
  const keys = new Set<string>();
  const primary = process.env.SCRAPER_API_KEY?.trim();
  if (primary) keys.add(primary);
  const additional = process.env.SCRAPER_API_KEYS?.split(/[,;\s]+/).map((key) => key.trim()).filter(Boolean) ?? [];
  additional.forEach((key) => keys.add(key));
  return [...keys];
}

function buildProxyUrl(targetUrl: string, apiKey: string): string {
  return `https://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;
}

function isBlockedProxyResponse(status: number, body: string): boolean {
  const normalized = body.toLowerCase();
  return (
    status === 403 ||
    status === 429 ||
    normalized.includes("exhausted the api credits") ||
    normalized.includes("quota") ||
    normalized.includes("subscription") ||
    normalized.includes("billing")
  );
}

export async function fetchUrlWithScraperFallback(
  targetUrl: string,
  responseType: "text" | "json" = "text"
) {
  const gotScraping = await gotScrapingPromise;
  const keys = parseScraperKeys();

  let lastProxyError: Error | null = null;

  for (const apiKey of keys) {
    const proxyUrl = buildProxyUrl(targetUrl, apiKey);
    try {
      const response = await gotScraping.get(proxyUrl, {
        timeout: { request: 30000 },
        responseType,
      });

      const bodyText =
        typeof response.body === "string"
          ? response.body
          : JSON.stringify(response.body);

      if (!isBlockedProxyResponse(response.statusCode, bodyText)) {
        return response;
      }

      lastProxyError = new Error(
        `[scraper] Proxy response blocked (${response.statusCode}) for key ${apiKey.slice(0, 8)}...`
      );
      console.warn(lastProxyError.message);
    } catch (err: any) {
      const message = err?.message ?? String(err);
      lastProxyError = new Error(
        `[scraper] Proxy fetch failed for key ${apiKey.slice(0, 8)}...: ${message}`
      );
      console.warn(lastProxyError.message);
      continue;
    }
  }

  if (keys.length === 0) {
    console.warn("[scraper] No SCRAPER_API_KEY or SCRAPER_API_KEYS configured. Attempting direct fetch.");
  } else {
    console.warn("[scraper] All ScraperAPI keys failed or are blocked. Attempting direct fetch.");
  }

  try {
    const response = await gotScraping.get(targetUrl, {
      timeout: { request: 30000 },
      responseType,
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: targetUrl,
      },
    });
    return response;
  } catch (err: any) {
    throw new Error(
      `[scraper] Direct fetch failed: ${err?.message ?? String(err)}; proxy last error: ${lastProxyError?.message ?? "none"}`
    );
  }
}
