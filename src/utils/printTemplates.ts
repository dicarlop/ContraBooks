import { Fyo, t } from 'fyo';
import { ModelNameEnum } from 'models/types';
import { FieldTypeEnum, Schema, TargetField } from 'schemas/types';
import { getValueMapFromList } from 'utils/index';
import { TemplateFile } from 'utils/types';
import { getDocFromNameIfExistsElseNew } from './ui';
export { getPrintDimensions, normalizePrintOrientation, normalizePrintPaper } from './printGeometry';
export type { PrintOrientation, PrintPaper } from './printGeometry';
export { PRINT_PAPER_SIZES } from './printGeometry';

export type PrintTemplateHint = {
  [key: string]: string | PrintTemplateHint | PrintTemplateHint[];
};
type PrintTemplateData = Record<string, unknown>;
type TemplateUpdateItem = {
  name: string;
  template: string;
  type: string;
  width: number;
  height: number;
};

const printSettingsFields = [
  'logo',
  'displayLogo',
  'color',
  'font',
  'email',
  'phone',
  'address',
  'companyName',
  'amountInWords',
  'displaytermsandconditions',
  'termsAndConditions',
];
const accountingSettingsFields = ['gstin', 'taxId'];

export function getPrintTemplatePropHints(schemaName: string, fyo: Fyo) {
  const hints: PrintTemplateHint = {};
  const schema = fyo.schemaMap[schemaName]!;
  hints.doc = getPrintTemplateDocHints(schema, fyo);

  const printSettingsHints = getPrintTemplateDocHints(
    fyo.schemaMap[ModelNameEnum.PrintSettings]!,
    fyo,
    printSettingsFields
  );
  const accountingSettingsHints = getPrintTemplateDocHints(
    fyo.schemaMap[ModelNameEnum.AccountingSettings]!,
    fyo,
    accountingSettingsFields
  );

  hints.print = {
    ...printSettingsHints,
    ...accountingSettingsHints,
  };

  if (schemaName?.endsWith('Invoice')) {
    (hints.doc as PrintTemplateData).totalDiscount = fyo.t`Total Discount`;
    (hints.doc as PrintTemplateData).showHSN = fyo.t`Show HSN`;
  }

  return hints;
}

function getPrintTemplateDocHints(
  schema: Schema,
  fyo: Fyo,
  fieldnames?: string[],
  linkLevel?: number
): PrintTemplateHint {
  linkLevel ??= 0;
  const hints: PrintTemplateHint = {};
  const links: PrintTemplateHint = {};

  let fields = schema.fields;
  if (fieldnames) {
    fields = fields.filter((f) => fieldnames.includes(f.fieldname));
  }

  for (const field of fields) {
    const { fieldname, fieldtype, label, meta } = field;
    if (fieldtype === FieldTypeEnum.Attachment || meta) {
      continue;
    }

    hints[fieldname] = label ?? fieldname;
    const { target } = field as TargetField;
    const targetSchema = fyo.schemaMap[target];
    if (fieldtype === FieldTypeEnum.Link && targetSchema && linkLevel < 2) {
      links[fieldname] = getPrintTemplateDocHints(
        targetSchema,
        fyo,
        undefined,
        linkLevel + 1
      );
    }

    if (fieldtype === FieldTypeEnum.Table && targetSchema) {
      hints[fieldname] = [getPrintTemplateDocHints(targetSchema, fyo)];
    }
  }

  hints.submitted = fyo.t`Submitted`;
  hints.entryType = fyo.t`Entry Type`;
  hints.entryLabel = fyo.t`Entry Label`;

  if (Object.keys(links).length) {
    hints.links = links;
  }
  return hints;
}

async function getPrintTemplateDocValues(doc: Doc, fieldnames?: string[]) {
  const values: PrintTemplateData = {};
  if (!(doc instanceof Doc)) {
    return values;
  }

  let fields = doc.schema.fields;
  if (fieldnames) {
    fields = fields.filter((f) => fieldnames.includes(f.fieldname));
  }

  // Set Formatted Doc Data
  for (const field of fields) {
    const { fieldname, fieldtype, meta } = field;
    if (fieldtype === FieldTypeEnum.Attachment || meta) {
      continue;
    }

    const value = doc.get(fieldname);

    if (!value) {
      values[fieldname] = '';
      continue;
    }

    if (!Array.isArray(value)) {
      values[fieldname] = doc.fyo.format(value, field, doc);
      continue;
    }

    const table: PrintTemplateData[] = [];
    for (const row of value) {
      const rowProps = await getPrintTemplateDocValues(row);
      table.push(rowProps);
    }

    values[fieldname] = table;
  }

  values.submitted = doc.submitted;
  values.entryType = doc.schema.name;
  values.entryLabel = doc.schema.label;

  // Set Formatted Doc Link Data
  await doc.loadLinks();
  const links: PrintTemplateData = {};
  for (const [linkName, linkDoc] of Object.entries(doc.links ?? {})) {
    if (fieldnames && !fieldnames.includes(linkName)) {
      continue;
    }

    links[linkName] = await getPrintTemplateDocValues(linkDoc);
  }

  if (Object.keys(links).length) {
    values.links = links;
  }
  return values;
}

export {
  constructPrintDocument,
  getPathAndMakePDF,
  renderAndPrint,
} from 'src/apps/template-builder/services/printing';
export type { PrintOptions } from 'src/utils/printOptions';
export { getPrintTemplatePropValues } from 'src/apps/template-builder/services/printValues';

export async function updatePrintTemplates(fyo: Fyo) {
  const templateFiles = await ipc.getTemplates(
    fyo.singles.PrintSettings?.posPrintWidth as number
  );
  const existingTemplates = (await fyo.db.getAll(ModelNameEnum.PrintTemplate, {
    fields: ['name', 'modified'],
    filters: { isCustom: false },
  })) as { name: string; modified: Date }[];

  const nameModifiedMap = getValueMapFromList(
    existingTemplates,
    'name',
    'modified'
  );

  const updateList: TemplateUpdateItem[] = [];
  for (const templateFile of templateFiles) {
    const updates = getPrintTemplateUpdateList(
      templateFile,
      nameModifiedMap,
      fyo
    );

    updateList.push(...updates);
  }

  const isLogging = fyo.store.skipTelemetryLogging;
  fyo.store.skipTelemetryLogging = true;
  for (const { name, type, template, width, height } of updateList) {
    const doc = await getDocFromNameIfExistsElseNew(
      ModelNameEnum.PrintTemplate,
      name
    );

    const updateData = {
      name,
      type,
      template,
      isCustom: false,
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
    };

    await doc.set(updateData);
    await doc.sync();
  }
  fyo.store.skipTelemetryLogging = isLogging;
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
    if (fileModified && dbModified.valueOf() <= fileModified.valueOf()) {
      continue;
    }

    templateList.push({
      height,
      width,
      name,
      type,
      template,
    });
  }
  return templateList;
}

function getNameAndTypeFromTemplateFile(
  file: string,
  fyo: Fyo
): { name: string; type: string }[] {
  /**
   * Template File Name Format:
   * TemplateName[.SchemaName].template.html
   *
   * If the SchemaName is absent then it is assumed
   * that the SchemaName is:
   * - SalesInvoice
   * - SalesQuote
   * - PurchaseInvoice
   */

  const fileName = file.split('.template.html')[0];
  const name = fileName.split('.')[0];
  const schemaName = fileName.split('.')[1];

  if (schemaName) {
    const label = fyo.schemaMap[schemaName]?.label ?? schemaName;
    return [{ name: `${name} - ${label}`, type: schemaName }];
  }

  return [
    ModelNameEnum.SalesInvoice,
    ModelNameEnum.SalesQuote,
    ModelNameEnum.PurchaseInvoice,
  ].map((schemaName) => {
    const label = fyo.schemaMap[schemaName]?.label ?? schemaName;
    return { name: `${name} - ${label}`, type: schemaName };
  });
}

export const baseTemplate = `<main class="h-full w-full bg-white">

  <!-- Edit This Code -->
  <header class="p-4 flex justify-between border-b">
    <h2 
      class="font-semibold text-2xl" 
      :style="{ color: print.color }"
    >
      {{ print.companyName }}
    </h2>
    <h2 class="font-semibold text-2xl" >
      {{ doc.name }}
    </h2>
  </header>

  <div class="p-4 text-gray-600">
    Edit the code in the Template Editor on the right
    to create your own personalized custom template.
  </div>

</main>
`;
