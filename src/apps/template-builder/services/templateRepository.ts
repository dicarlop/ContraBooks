import { ModelNameEnum } from 'models/types';
import { PrintTemplate } from 'models/baseModels/PrintTemplate';
import type { Doc } from 'fyo/model/doc';
import { getDocFromNameIfExistsElseNew } from 'src/utils/ui';
import { getPrintTemplatePropValues } from 'src/utils/printTemplates';
import { getTemplatePreset, templatePresetNames, TemplatePresetName } from 'src/utils/templatePresets';
import type { PrintValues } from 'src/utils/types';

export async function loadTemplate(name: string): Promise<PrintTemplate> {
  return (await getDocFromNameIfExistsElseNew(
    ModelNameEnum.PrintTemplate,
    name
  )) as PrintTemplate;
}

export async function ensureTemplateDefaults(
  template: PrintTemplate,
  defaultType = ModelNameEnum.SalesInvoice
): Promise<void> {
  if (!template.type) {
    await template.set('type', defaultType);
  }

  if (!template.template) {
    await template.set('template', getTemplatePreset('Professional'));
  }
}

export function normalizeTemplate(template: string): string {
  const d = new DOMParser().parseFromString(template, 'text/html');
  let changed = false;
  let index = 0;
  const used = new Set<string>();

  for (const node of Array.from(d.body.querySelectorAll('*'))) {
    if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') {
      continue;
    }

    const existing = node.getAttribute('data-cb-id');
    if (existing) {
      used.add(existing);
      continue;
    }

    while (used.has(`cb-${index}`)) {
      index++;
    }

    node.setAttribute('data-cb-id', `cb-${index++}`);
    used.add(node.getAttribute('data-cb-id')!);
    changed = true;
  }

  return changed ? d.body.innerHTML : template;
}

export async function getPreviewDocument(
  template: PrintTemplate,
  fyo: Doc['fyo']
): Promise<{ doc: Doc | null; values: PrintValues | null }> {
  const docType = template.type || ModelNameEnum.SalesInvoice;
  const list = (await fyo.db.getAll(docType, {
    limit: 1,
    order: 'desc',
    orderBy: 'created',
    filters: { cancelled: false },
  })) as Array<{ name: string }>;

  if (!list[0]) {
    return { doc: null, values: null };
  }

  const doc = await getDocFromNameIfExistsElseNew(docType, list[0].name);
  return { doc, values: await getPrintTemplatePropValues(doc) };
}

export async function saveTemplate(template: PrintTemplate): Promise<void> {
  await template.sync();
}

export function getPresetTemplate(name: TemplatePresetName): string {
  return getTemplatePreset(name);
}

export { templatePresetNames };
export type { TemplatePresetName };

