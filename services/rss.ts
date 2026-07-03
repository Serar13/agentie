import { XMLParser } from "fast-xml-parser";

export type RssItem = {
  title: string;
  url: string;
  excerpt?: string;
  publishedAt?: Date;
  sourceName: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "text"
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function text(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && value && "text" in value) {
    return text((value as { text?: unknown }).text);
  }
  return "";
}

function parseDate(value: unknown) {
  const raw = text(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function fetchRssItems(feedUrl: string, sourceName: string): Promise<RssItem[]> {
  const response = await fetch(feedUrl, {
    headers: {
      "user-agent": "PositiveNewsAgency/0.1 (+https://example.com)"
    },
    next: { revalidate: 1800 }
  });

  if (!response.ok) {
    throw new Error(`RSS request failed for ${feedUrl}: ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml);
  const channelItems = asArray(parsed?.rss?.channel?.item);
  const atomItems = asArray(parsed?.feed?.entry);
  const items = channelItems.length > 0 ? channelItems : atomItems;

  return items
    .map((item) => {
      const rawLink = item.link;
      const url =
        typeof rawLink === "string"
          ? rawLink
          : Array.isArray(rawLink)
            ? text(rawLink[0]?.href ?? rawLink[0])
            : text(rawLink?.href ?? rawLink);

      return {
        title: text(item.title).trim(),
        url: url.trim(),
        excerpt: text(item.description ?? item.summary ?? item.content).trim(),
        publishedAt: parseDate(item.pubDate ?? item.published ?? item.updated),
        sourceName
      };
    })
    .filter((item) => item.title && item.url);
}
