import { App } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { getInitializedPrintWindow } from './saveHtmlAsPdf';

const printPageSize = (width: number, height: number) => ({
  width: Math.round(width * 10000),
  height: Math.round(height * 10000),
});

export async function printHtmlDocument(
  html: string,
  app: App,
  width: number,
  height: number
): Promise<boolean> {
  const tempRoot = app.getPath('temp');
  const tempFile = path.join(tempRoot, `temp-print-${Date.now()}-${process.pid}.html`);
  await fs.writeFile(tempFile, html, { encoding: 'utf-8' });

  let printWindow: Awaited<ReturnType<typeof getInitializedPrintWindow>> | undefined;
  try {
    printWindow = await getInitializedPrintWindow(tempFile, width, height);

    return await new Promise<boolean>((resolve) => {
      printWindow!.webContents.print(
        {
          silent: false,
          printBackground: true,
          pageSize: printPageSize(width, height),
        },
        (success) => resolve(success)
      );
    });
  } finally {
    printWindow?.close();
    await fs.unlink(tempFile).catch(() => undefined);
  }
}
