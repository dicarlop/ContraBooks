export type PrintPaper = 'Letter' | 'A4' | 'Legal';
export type PrintOrientation = 'Portrait' | 'Landscape';

export const PRINT_PAPER_SIZES: Record<PrintPaper, readonly [number, number]> = {
  Letter: [21.59, 27.94],
  A4: [21, 29.7],
  Legal: [21.59, 35.56],
};

export function normalizePrintPaper(value: unknown): PrintPaper {
  return value === 'A4' || value === 'Legal' || value === 'Letter' ? value : 'Letter';
}

export function normalizePrintOrientation(value: unknown): PrintOrientation {
  return value === 'Landscape' ? 'Landscape' : 'Portrait';
}

export function getPrintDimensions(
  paper: PrintPaper,
  orientation: PrintOrientation
): [number, number] {
  const [width, height] = PRINT_PAPER_SIZES[normalizePrintPaper(paper)];
  return normalizePrintOrientation(orientation) === 'Landscape'
    ? [height, width]
    : [width, height];
}
