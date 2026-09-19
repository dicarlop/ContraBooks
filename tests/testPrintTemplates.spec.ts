import test from 'tape';
import {
  getPrintDimensions,
  normalizePrintOrientation,
  normalizePrintPaper,
  PRINT_PAPER_SIZES,
} from 'src/utils/printTemplates';

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
