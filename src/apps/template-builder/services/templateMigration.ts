import { Fyo } from 'fyo';
import { ModelNameEnum } from 'models/types';
import { getValueMapFromList } from 'utils/index';
import { TemplateFile } from 'utils/types';
import { getDocFromNameIfExistsElseNew } from 'src/utils/ui';

type TemplateUpdateItem = {
  name: string;
  template: string;
  type: string;
  width: number;
  height: number;
};

/** Synchronizes bundled print templates into the local company file. */
export async function updatePrintTemplates(fyo: Fyo): Promise<void> {
  const templateFiles = await ipc.getTemplates(fyo.singles.PrintSettings?.posPrintWidth as number);
  const existingTemplates = (await fyo.db.getAll(ModelNameEnum.PrintTemplate, {
    fields: ['name', 'modified'],
    filters: { isCustom: false },
  })) as { name: string; modified: Date }[];

  const nameModifiedMap = getValueMapFromList(existingTemplates, 'name', 'modified');
  const updateList: TemplateUpdateItem[] = [];
  for (const templateFile of templateFiles) {
    updateList.push(...getPrintTemplateUpdateList(templateFile, nameModifiedMap, fyo));
  }

  const isLogging = fyo.store.skipTelemetryLogging;
  fyo.store.skipTelemetryLogging = true;
  try {
    for (const { name, type, template, width, height } of updateList) {
      const doc = await getDocFromNameIfExistsElseNew(ModelNameEnum.PrintTemplate, name);
      await doc.set({
        name, type, template, isCustom: false,
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
      });
      await doc.sync();
    }
  } finally {
    fyo.store.skipTelemetryLogging = isLogging;
  }
}

function getPrintTemplateUpdateList(
  { file, template, modified: modifiedString, width, height }: TemplateFile,
  nameModifiedMap: Record<string, Date>,
  fyo: Fyo
): TemplateUpdateItem[] {
  const templateList: TemplateUpdateItem[] = [];
  const dbModified = new Date(modifiedString);
  for (const { name, type } of getNameAndTypeFromTemplateFile(file, fyo)) {
    const fileModified = nameModifiedMap[name];
    if (fileModified && dbModified.valueOf() <= fileModified.valueOf()) continue;
    templateList.push({ height, width, name, type, template });
  }
  return templateList;
}

function getNameAndTypeFromTemplateFile(file: string, fyo: Fyo): { name: string; type: string }[] {
  const fileName = file.split('.template.html')[0];
  const name = fileName.split('.')[0];
  const schemaName = fileName.split('.')[1];
  if (schemaName) {
    const label = fyo.schemaMap[schemaName]?.label ?? schemaName;
    return [{ name: `${name} - ${label}`, type: schemaName }];
  }
  return [ModelNameEnum.SalesInvoice, ModelNameEnum.SalesQuote, ModelNameEnum.PurchaseInvoice].map((schemaName) => {
    const label = fyo.schemaMap[schemaName]?.label ?? schemaName;
    return { name: `${name} - ${label}`, type: schemaName };
  });
}