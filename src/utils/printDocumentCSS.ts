import type { PrintOrientation, PrintPaper } from './printGeometry';
import {
  normalizePrintOrientation,
  normalizePrintPaper,
} from './printGeometry';

export type PrintDocumentStyleOptions = {
  repeatHeader?: boolean;
  fitWidth?: boolean;
  pageNumbers?: boolean;
  paper?: PrintPaper;
  orientation?: PrintOrientation;
};

export function getPrintDocumentCSS(
  options: PrintDocumentStyleOptions = {}
): string {
  const paper = normalizePrintPaper(options.paper);
  const orientation = normalizePrintOrientation(options.orientation);

  return `
    @media print {
      [data-cb-print="hidden"] { display: none !important; }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: white;
      }

      @page {
        margin: 0;
        size: ${paper} ${orientation.toLowerCase()};
      }

      * {
        box-sizing: border-box;
      }

      html, body {
        width: 100%;
        min-height: 100%;
        overflow: visible !important;
      }

      body > [data-cb-print-root] {
        width: 100%;
        min-height: 100%;
        margin: 0 !important;
        overflow: visible !important;
      }

      [data-cb-id] {
        cursor: default !important;
        outline: none !important;
      }

      table { page-break-inside: auto; }
      thead { page-break-inside: avoid; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      th, td { break-inside: avoid; }
      h1, h2, h3, h4, h5, h6 { break-after: avoid; page-break-after: avoid; }
      p, li { orphans: 2; widows: 2; }
      img, svg, canvas { max-width: 100%; }
      pre, code { overflow-wrap: anywhere; white-space: pre-wrap; }
      [data-cb-section="footer"] { break-inside: avoid; page-break-inside: avoid; }
      [data-cb-section="footerText"], [data-cb-section="terms"], [data-cb-section="pageNumbers"] { break-inside: avoid; page-break-inside: avoid; }

      ${options.repeatHeader === false ? '' : 'table thead { display: table-header-group !important; }'}
      ${options.pageNumbers === false ? '' : `.cb-page-number, [data-cb-section="pageNumbers"] { font-size: 0 !important; } .cb-page-number::after, [data-cb-section="pageNumbers"]::after { content: "Page " counter(page) " of " counter(pages); font-size: 9pt !important; }`}
      ${options.fitWidth === false ? '' : 'body > div { width: 100% !important; max-width: 100% !important; } [data-cb-items-table] { width: 100% !important; max-width: 100% !important; table-layout: fixed !important; }'}
    }
  `;
}
