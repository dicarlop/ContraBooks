export {
  ensureTemplateDefaults,
  getPresetTemplate,
  getPreviewDocument,
  loadTemplate,
  normalizeTemplate,
  saveTemplate,
  templatePresetNames,
} from './templateRepository';
export type { TemplatePresetName } from './templateRepository';

export {
  getDefaultTemplateKey,
  getDefaultTemplateName,
  setDefaultTemplateName,
} from './templateDefaults';

export {
  constructPrintDocument,
  exportTemplatePDF,
  getPathAndMakePDF,
  printTemplate,
  renderAndPrint,
} from './printing';
export type { PrintOptions } from 'src/utils/printOptions';

export { updatePrintTemplates } from './templateMigration';
