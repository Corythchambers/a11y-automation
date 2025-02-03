import { chromium, Browser, Page } from "playwright";
import { getPageStructureHash } from "./helpers/get-url-hash";
import { scanPage, ScanResult } from "./helpers/scan-page";
import { extractLinks } from "./helpers/extract-links";
import { generateReport } from "./report/generate-report";
import fs from "fs";

/**
 * Recursively scans a website for accessibility issues.
 */
async function scanWebsite(startUrl: string): Promise<void> {
    const browser: Browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    let urlsToScan: Set<string> = new Set([startUrl]);
    let scannedUrls: Set<string> = new Set();
    let seenPageHashes: Set<string> = new Set();
    let allResults: ScanResult[] = [];
    const MAX_CONCURRENT_SCANS = 2;
    const MAX_SCAN_LOOPS = 10;

    for (let i = 0; i < MAX_SCAN_LOOPS && urlsToScan.size > 0; i++) {
        console.log(`\n\n~~~~~~~~~~~~~~~~~~ Loop ${i + 1} ~~~~~~~~~~~~~~~~~~`);
        console.log(`${urlsToScan.size} pages remaining to scan\n\n`);
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')

        const batch = Array.from(urlsToScan).slice(0, MAX_CONCURRENT_SCANS);

        batch.forEach(url => {
            urlsToScan.delete(url);  // ✅ Lock URL before scanning
            scannedUrls.add(url);    // ✅ Mark as scanned
        });

        const scanPromises = batch.map(async (url) => {
            const page = await context.newPage();

            try {
                console.log()
                console.log(`Scanning: ${url}`);
                await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

                await page.waitForSelector("body", { state: "attached", timeout: 30000 });
                await page.waitForSelector(".loading-spinner", { state: "hidden", timeout: 30000 }).catch(() => {});

                const pageHash = await getPageStructureHash(page);
                if (seenPageHashes.has(pageHash)) {
                    console.log(`Skipping duplicate page structure: ${url}`);
                    return;
                }
                seenPageHashes.add(pageHash);

                const scanResults = await scanPage(page, url);
                allResults.push(scanResults);

                const newLinks = await extractLinks(page, startUrl, urlsToScan, scannedUrls);
                newLinks.forEach(link => {
                    if (!scannedUrls.has(link) && !urlsToScan.has(link)) {
                        urlsToScan.add(link);
                        console.log(`Added new link: ${link}`);
                    }
                });

            } catch (error) {
                console.error(`Error scanning: ${url}: ${(error as Error).message}`);
            } finally {
                await page.close();
            }
        });

        await Promise.all(scanPromises);
    }

    await browser.close();
    console.log("\nScan complete. Generating report...");

    const reportHTML = generateReport(allResults);
    fs.writeFileSync("accessibility-report.html", reportHTML);

    console.log("Report saved: accessibility-report.html");
}

const website = process.argv[2];
if (!website) {
    console.error("Usage: ts-node accessibility-scan.ts <website-url>");
    process.exit(1);
}

scanWebsite(website);
