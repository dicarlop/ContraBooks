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

export { printTemplate, exportTemplatePDF, renderAndPrint } from './printing';
