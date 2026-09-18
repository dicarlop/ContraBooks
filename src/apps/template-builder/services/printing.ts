import { getPathAndMakePDF } from 'src/utils/printTemplates';
import type { PrintOptions } from 'src/utils/printTemplates';

export async function printTemplate(
  name: string,
  html: string,
  width: number,
  height: number,
  options: PrintOptions = {}
): Promise<void> {
  await getPathAndMakePDF(name, html, width, height, true, options);
}

export async function exportTemplatePDF(
  name: string,
  html: string,
  width: number,
  height: number,
  options: PrintOptions = {}
): Promise<void> {
  await getPathAndMakePDF(name, html, width, height, false, options);
}

export async function renderAndPrint(
  container: { savePDF?: (name?: string, shouldPrint?: boolean) => Promise<unknown> },
  name?: string
): Promise<void> {
  await container.savePDF?.(name, true);
}
