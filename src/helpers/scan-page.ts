import AxeBuilder from "@axe-core/playwright";
import { Page } from "playwright";

export interface ScanResult {
    url: string;
    violations: Violation[];
  }

export interface Violation {
    id: string;
    description: string;
    help: string;
    helpUrl: string;
    impact: string;
    nodes: string[];
  }

/**
 * Scans a page for accessibility issues using Axe.
 */
export async function scanPage(page: Page, url: string): Promise<ScanResult> {
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