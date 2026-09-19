import { t } from 'fyo';
import { getPrintDocumentCSS } from 'src/utils/printDocumentCSS';
import { getPrintDimensions, normalizePrintOrientation, normalizePrintPaper } from 'src/utils/printGeometry';
import type { PrintOptions } from 'src/utils/printOptions';
import { getSavePath, showExportInFolder } from 'src/utils/ui';
import { showToast } from 'src/utils/interactive';

export async function printTemplate(name: string, html: string, width: number, height: number, options: PrintOptions = {}): Promise<void> {
  await getPathAndMakePDF(name, html, width, height, true, options);
}

export async function exportTemplatePDF(name: string, html: string, width: number, height: number, options: PrintOptions = {}): Promise<void> {
  await getPathAndMakePDF(name, html, width, height, false, options);
}

export async function renderAndPrint(container: { savePDF?: (name?: string, shouldPrint?: boolean) => Promise<unknown> }, name?: string): Promise<void> {
  await container.savePDF?.(name, true);
}

export function constructPrintDocument(innerHTML: string, options: PrintOptions = {}): string {
  const html = document.createElement('html');
  const head = document.createElement('head');
  const body = document.createElement('body');
  const style = getAllCSSAsStyleElem();
  const printCSS = document.createElement('style');
  printCSS.innerHTML = getPrintDocumentCSS(options);
  head.innerHTML = ['<meta charset="UTF-8">', '<title>Print Window</title>'].join('\n');
  head.append(style, printCSS);
  const printRoot = document.createElement('div');
  printRoot.setAttribute('data-cb-print-root', 'true');
  printRoot.innerHTML = innerHTML;
  body.appendChild(printRoot);
  html.append(head, body);
  return html.outerHTML;
}

export async function getPathAndMakePDF(name: string, innerHTML: string, width: number, height: number, shouldPrint = false, options: PrintOptions = {}): Promise<void> {
  const [printWidth, printHeight] = options.paper || options.orientation ? getPrintDimensions(normalizePrintPaper(options.paper), normalizePrintOrientation(options.orientation)) : [width, height];
  const html = constructPrintDocument(innerHTML, options);
  if (!shouldPrint) {
    const { filePath: savePath } = await getSavePath(name, 'pdf');
    if (!savePath) return;
    const success = await ipc.makePDF(html, savePath, printWidth, printHeight);
    if (success) showExportInFolder(t\`Save as PDF Successful\`, savePath);
    else showToast({ message: t\`Export Failed\`, type: 'error' });
    return;
  }
  const success = await ipc.printDocument(html, printWidth, printHeight);
  if (success) showToast({ message: t\`Print Successful\`, type: 'success' });
  else showToast({ message: t\`Print Failed\`, type: 'error' });
}

function getAllCSSAsStyleElem(): HTMLStyleElement {
  const cssTexts: string[] = [];
  for (const sheet of document.styleSheets) {
    for (const rule of sheet.cssRules) cssTexts.push(rule.cssText);
    if (sheet.ownerRule) cssTexts.push(sheet.ownerRule.cssText);
  }
  const styleElem = document.createElement('style');
  styleElem.innerHTML = cssTexts.join('\n');
  return styleElem;
}
