import { Page } from "playwright";

/**
 * Extracts all unique internal links from a page.
 */
export async function extractLinks(page: Page, baseUrl: string): Promise<Set<string>> {
  const links = await page.$$eval("a[href]", (anchors) =>
    anchors.map((a) => (a as HTMLAnchorElement).href),
  );

  const domain = new URL(baseUrl).origin;
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