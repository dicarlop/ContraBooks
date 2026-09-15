import { App, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';

const printOptions = (width: number, height: number) => ({
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  pageSize: {
    height: height / 2.54,
    width: width / 2.54,
  },
  printBackground: true,
});

export async function renderHtmlAsPdf(
  html: string,
  app: App,
  width: number,
  height: number
): Promise<Buffer> {
  const tempRoot = app.getPath('temp');
  const tempDir = await fs.mkdtemp(path.join(tempRoot, 'contrabooks-pdf-'));
  const htmlPath = path.join(tempDir, 'document.html');

  await fs.writeFile(htmlPath, html, { encoding: 'utf-8' });

  let printWindow: BrowserWindow | undefined;
  try {
    printWindow = await getInitializedPrintWindow(htmlPath, width, height);
    return await printWindow.webContents.printToPDF(printOptions(width, height));
  } finally {
    printWindow?.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

export async function saveHtmlAsPdf(
  html: string,
  savePath: string,
  app: App,
  width: number,
  height: number
): Promise<boolean> {
  const data = await renderHtmlAsPdf(html, app, width, height);
  await fs.writeFile(savePath, data);
  return true;
}

export async function getInitializedPrintWindow(
  printFilePath: string,
  width: number,
  height: number
) {
  const printWindow = new BrowserWindow({
    width: Math.floor(width * 28.333333),
    height: Math.floor(height * 28.333333),
    show: false,
  });

  await printWindow.loadFile(printFilePath);
  return printWindow;
}
