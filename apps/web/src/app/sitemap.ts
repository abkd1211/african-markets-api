import { MetadataRoute } from 'next';
import { api } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://african-markets.vercel.app';

  try {
    const [gse, ngx] = await Promise.all([
      api.gse.live(),
      api.ngx.live(),
    ]);

    const gseUrls = gse.tickers.map((t) => ({
      url: `${baseUrl}/ticker/gse/${t.symbol.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    const ngxUrls = ngx.tickers.map((t) => ({
      url: `${baseUrl}/ticker/ngx/${t.symbol.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'always' as const,
        priority: 1,
      },
      ...gseUrls,
      ...ngxUrls,
    ];
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'always' as const,
        priority: 1,
      },
    ];
  }
}
