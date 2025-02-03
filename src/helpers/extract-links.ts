import { Page } from "playwright";

/**
 * Extracts all unique internal links from a page while preventing duplicates.
 */
export async function extractLinks(
    page: Page, 
    baseUrl: string, 
    urlsToScan: Set<string>, 
    scannedUrls: Set<string>
): Promise<Set<string>> {
    console.log("Extracting links");
    const domain = new URL(baseUrl).origin;
    const links = await page.$$eval("a[href]", (anchors) =>
        anchors.map((a) => (a as HTMLAnchorElement).href),
    );

    const urlPatterns = [
      /\/products\/[^/]+-\d+$/,  // Matches: /products/hot-smoked-roasted-salmon-352/
      /\/recipes\/[^/]+-\d+$/,   // Matches: /recipes/classic-beef-tacos-123456/
    ];

    function normalizeUrl(url: string): string {
        try {
            const urlObj = new URL(url, domain);
            urlObj.search = ""; // Remove query parameters
            return urlObj.origin + urlObj.pathname; // Return base URL without fragments
        } catch {
            return url;
        }
    }

    const uniqueLinks = new Set<string>();

    links.forEach(link => {
        try {
            const normalizedLink = normalizeUrl(link);

            // Ensure it's an internal link
            if (!normalizedLink.startsWith(domain)) return;

            // 🛑 Check if the link was already scanned
            if (scannedUrls.has(normalizedLink)) {
                return;
            }

            // 🛑 Check if the link is already scheduled for scanning
            if (urlsToScan.has(normalizedLink)) {
                return;
            }

            // 🛑 Skip duplicate structured product/recipe pages
            if (urlPatterns.some(pattern => pattern.test(normalizedLink))) {
                console.log(`🛑🛑 Skipping structured page (Product/Recipe): ${normalizedLink}`);
                return;
            }

            console.log(`✅ Adding new link: ${normalizedLink}`);
            uniqueLinks.add(normalizedLink);
            urlsToScan.add(normalizedLink); 

        } catch (error) {
            console.error(`Error processing link: ${link} - ${error}`);
        }
    });

    return uniqueLinks;
}
