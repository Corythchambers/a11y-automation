import crypto from "crypto";
import { Page } from "playwright";

/**
 * Generate a hash based on the page's structure, ignoring text and dynamic data.
 */
export async function getPageStructureHash(page: Page): Promise<string> {
    const htmlStructure = await page.evaluate(() => {
        function cleanHtml(node: HTMLElement): string {
            if (!node) return "";
            if (["SCRIPT", "STYLE", "META", "LINK"].includes(node.tagName)) return "";

            // Clone the node to avoid modifying the live DOM
            const clone = node.cloneNode(true) as HTMLElement;

            // Remove elements with dynamic data
            clone.querySelectorAll("img, script, style, meta, link").forEach(el => el.remove());
            clone.querySelectorAll("[style]").forEach(el => el.removeAttribute("style"));

            // Remove text content (keeps only structure)
            clone.querySelectorAll("*").forEach(el => (el.textContent = ""));

            return clone.outerHTML;
        }

        return cleanHtml(document.body);
    });

    // ✅ Now hash the structure in Node.js
    return crypto.createHash("sha256").update(htmlStructure).digest("hex");
}
