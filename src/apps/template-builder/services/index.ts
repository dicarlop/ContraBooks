export {
  ensureTemplateDefaults,
  getPresetTemplate,
  getPreviewDocument,
  loadTemplate,
  normalizeTemplate,
  saveTemplate,
  renderAndPrint,
  templatePresetNames,
} from './templateRepository';
export type { TemplatePresetName } from './templateRepository';

export { printTemplate, exportTemplatePDF } from './printing';
