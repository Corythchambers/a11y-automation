import { Page } from "playwright";

/**
 * Extracts all unique internal links from a page.
 */
export async function extractLinks(page: Page, baseUrl: string): Promise<Set<string>> {
  const domain = new URL(baseUrl).origin;
  const links = await page.$$eval("a[href]", (anchors) =>
    anchors.map((a) => (a as HTMLAnchorElement).href),
  );


  return new Set(
    links
      .map((link) => {
        try {
          const url = new URL(link, domain);
          return url.origin === domain ? url.href.split("#")[0] : null;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[],
  );
}

function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.search = ""
    return urlObj.origin + urlObj.pathname
  } catch (e) {
    return url
  }
}