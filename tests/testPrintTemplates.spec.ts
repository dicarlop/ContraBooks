import test from 'tape';
import { getPrintDocumentCSS } from 'src/utils/printDocumentCSS';
import {
  getPrintDimensions,
  normalizePrintOrientation,
  normalizePrintPaper,
  PRINT_PAPER_SIZES,
} from 'src/utils/printGeometry';

test('print geometry: paper dimensions stay stable', (t) => {
  t.deepEqual(
    getPrintDimensions('Letter', 'Portrait'),
    PRINT_PAPER_SIZES.Letter,
    'Letter portrait uses the canonical Letter dimensions'
  );
  t.deepEqual(
    getPrintDimensions('A4', 'Portrait'),
    PRINT_PAPER_SIZES.A4,
    'A4 portrait uses the canonical A4 dimensions'
  );
  t.deepEqual(
    getPrintDimensions('Legal', 'Portrait'),
    PRINT_PAPER_SIZES.Legal,
    'Legal portrait uses the canonical Legal dimensions'
  );
  t.deepEqual(
    getPrintDimensions('Letter', 'Landscape'),
    [PRINT_PAPER_SIZES.Letter[1], PRINT_PAPER_SIZES.Letter[0]],
    'Landscape swaps the canonical paper dimensions'
  );
  t.end();
});

test('print geometry: invalid persisted settings normalize safely', (t) => {
  t.equal(
    normalizePrintPaper(undefined),
    'Letter',
    'missing paper falls back to Letter'
  );
  t.equal(
    normalizePrintPaper('A3'),
    'Letter',
    'unsupported paper falls back to Letter'
  );
  t.equal(
    normalizePrintOrientation(undefined),
    'Portrait',
    'missing orientation falls back to Portrait'
  );
  t.equal(
    normalizePrintOrientation('Sideways'),
    'Portrait',
    'unsupported orientation falls back to Portrait'
  );
  t.end();
});


test('print document CSS: print layout options are isolated and deterministic', (t) => {
  const css = getPrintDocumentCSS({
    paper: 'A4',
    orientation: 'Landscape',
    repeatHeader: true,
    fitWidth: true,
    pageNumbers: true,
  });

  t.ok(css.includes('@page'), 'includes page rule');
  t.ok(css.includes('size: A4 landscape'), 'uses selected paper and orientation');
  t.ok(css.includes('table thead { display: table-header-group !important; }'), 'repeats table headers');
  t.ok(css.includes('counter(page) " of " counter(pages)'), 'includes page numbering counters');
  t.ok(css.includes('[data-cb-items-table]'), 'includes fit-width table rules');
  t.end();
});

test('print document CSS: disabled options remove optional rules', (t) => {
  const css = getPrintDocumentCSS({
    repeatHeader: false,
    fitWidth: false,
    pageNumbers: false,
  });

  t.notOk(css.includes('table thead { display: table-header-group !important; }'), 'does not force repeated headers');
  t.notOk(css.includes('counter(page) " of " counter(pages)'), 'does not inject page numbers');
  t.notOk(css.includes('[data-cb-items-table]'), 'does not force fit-width tables');
  t.ok(css.includes('[data-cb-print="hidden"]'), 'keeps print visibility rules');
  t.end();
});
