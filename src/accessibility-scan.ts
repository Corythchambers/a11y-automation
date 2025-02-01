import { chromium, Browser, Page } from "playwright";
import AxeBuilder from "@axe-core/playwright";

interface Violation {
  id: string;
  description: string;
  help: string;
  helpUrl: string;
  impact: string;
  nodes: string[];
}

interface ScanResult {
  url: string;
  violations: Violation[];
}

/**
 * Scans a page for accessibility issues using Axe.
 */
async function scanPage(page: Page, url: string): Promise<ScanResult> {
  console.log(`Scanning: ${url}`);
  const results = await new AxeBuilder({ page }).analyze();
  return {
    url,
    violations: results.violations.map((v) => ({
      id: v.id,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      impact: v.impact ?? "unknown",
      nodes: v.nodes.flatMap((node) => node.target.map(String)),
    })),
  };
}

/**
 * Extracts all unique internal links from a page.
 */
async function extractLinks(page: Page, baseUrl: string): Promise<Set<string>> {
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

/**
 * Recursively scans a website for accessibility issues.
 */
async function scanWebsite(startUrl: string): Promise<void> {
  const browser: Browser = await chromium.launch();
  const context = await browser.newContext();

  let urlsToScan: Set<string> = new Set([startUrl]);
  let scannedUrls: Set<string> = new Set();
  let allResults: ScanResult[] = [];

  while (urlsToScan.size > 0) {
    const url = urlsToScan.values().next().value;
    urlsToScan.delete(url);
    scannedUrls.add(url);

    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      const scanResults = await scanPage(page, url);
      allResults.push(scanResults);

      const newLinks = await extractLinks(page, startUrl);
      newLinks.forEach((link) => {
        if (!scannedUrls.has(link) && !urlsToScan.has(link)) {
          urlsToScan.add(link);
        }
      });
    } catch (error) {
      console.error(`Error scanning: ${url}: ${(error as Error).message}`);
    } finally {
      await page.close();
    }
  }
  await browser.close();
  console.log("Scan complete. Results:", JSON.stringify(allResults, null, 2));
}

const website = process.argv[2];
if (!website) {
  console.error("Usage: ts-node accessibility-scan.ts <website-url>");
  process.exit(1);
}

scanWebsite(website);
