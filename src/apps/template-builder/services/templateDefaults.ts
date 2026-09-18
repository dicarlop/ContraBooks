import type { Doc } from 'fyo/model/doc';
import type { Fyo } from 'fyo';
import { ModelNameEnum } from 'models/types';

export function getDefaultTemplateKey(schemaName: string): string {
  return (
    schemaName[0].toLowerCase() +
    schemaName.slice(1) +
    ModelNameEnum.PrintTemplate
  );
}

export async function getDefaultTemplateName(
  fyo: Fyo,
  schemaName: string,
  doc?: Doc
): Promise<string | undefined> {
  if (schemaName === ModelNameEnum.SalesInvoice && doc?.isPOS) {
    let templateName = fyo.singles.Defaults?.posPrintTemplate as
      | string
      | undefined;

    const posProfileName = fyo.singles.POSSettings?.posProfile as
      | string
      | undefined;

    if (posProfileName) {
      const posProfile = await fyo.doc.getDoc(
        ModelNameEnum.POSProfile,
        posProfileName
      );

      if (posProfile.posPrintTemplate) {
        templateName = posProfile.posPrintTemplate;
      }
    }

    return templateName;
  }

  return fyo.singles.Defaults?.get(getDefaultTemplateKey(schemaName)) as
    | string
    | undefined;
}

export async function setDefaultTemplateName(
  fyo: Fyo,
  schemaName: string,
  templateName: string
): Promise<void> {
  const defaults = fyo.singles.Defaults;
  if (!defaults) {
    throw new Error('Defaults settings are unavailable');
  }

  await defaults.set(getDefaultTemplateKey(schemaName), templateName);
  await defaults.sync();
}
