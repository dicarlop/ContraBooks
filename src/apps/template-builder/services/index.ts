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

export { printTemplate, exportTemplatePDF, renderAndPrint } from './printing';
