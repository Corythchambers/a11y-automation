import fs from "fs";
import path from "path";
import { ScanResult } from "../helpers/scan-page";

/**
 * Generates an interactive HTML report with expandable rows for details.
 */
export function generateReport(results: ScanResult[]): string {
  const tableRows = results.flatMap((result, index) => 
    result.violations.map((v, vIndex) => {
      const rowId = `details-${index}-${vIndex}`;
      return `
      <tr onclick="toggleDetails('${rowId}')" style="cursor: pointer;">
        <td>${result.url}</td>
        <td>${v.impact}</td>
        <td>${v.description}</td>
        <td><button onclick="toggleDetails('${rowId}'); event.stopPropagation();">Show Details</button></td>
      </tr>
      <tr id="${rowId}" class="hidden-row">
        <td colspan="4">
          <strong>Node:</strong> ${v.nodes}<br>
          <strong>Help:</strong> ${v.help}<br>
          <strong>Help URL:</strong> <a href="${v.helpUrl}" target="_blank">${v.helpUrl}</a><br>
          <strong>Violation ID:</strong> ${v.id}
        </td>
      </tr>
      `;
    })
  ).join("");

  const templatePath = path.join(__dirname, "template.html");
  let template = fs.readFileSync(templatePath, "utf-8");

  return template.replace("{{TABLE_ROWS}}", tableRows);
}
