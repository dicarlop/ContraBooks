import { Doc } from 'fyo/model/doc';
import { Field } from 'schemas/types';
import { GetAllOptions } from 'utils/db/types';

export function evaluateReadOnly(field: Field, doc?: Doc) {
  if (doc?.inserted && field.fieldname === 'numberSeries') {
    return true;
  }

  if (
    field.fieldname === 'name' &&
    (doc?.inserted || doc?.schema.naming !== 'manual')
  ) {
    return true;
  }

  if (doc?.isSubmitted || doc?.parentdoc?.isSubmitted) {
    return true;
  }

  if (doc?.isCancelled || doc?.parentdoc?.isCancelled) {
    return true;
  }

  return evaluateFieldMeta(field, doc, 'readOnly');
}

export function evaluateHidden(field: Field, doc?: Doc) {
  return evaluateFieldMeta(field, doc, 'hidden');
}

export function evaluateInvisible(field: Field, doc?: Doc) {
  return evaluateFieldMeta(field, doc, 'invisible');
}

export function evaluateRequired(field: Field, doc?: Doc) {
  return evaluateFieldMeta(field, doc, 'required');
}

function evaluateFieldMeta(
  field: Field,
  doc?: Doc,
  meta?: 'required' | 'hidden' | 'invisible' | 'readOnly',
  defaultValue = false
) {
  if (meta === undefined) {
    return defaultValue;
  }

  const value = field[meta];
  if (value !== undefined) {
    return value;
  }

  const docRecord = doc as Record<string, unknown> | undefined;
  const metaKey = meta as string;
  const metaObj = docRecord?.[metaKey] as
    | Record<string, (() => boolean) | undefined>
    | undefined;
  const evalFunction = metaObj?.[field.fieldname];
  if (typeof evalFunction === 'function') {
    return evalFunction();
  }

  return defaultValue;
}

export async function getLinkedEntries(
  doc: Doc
): Promise<Record<string, string[]>> {
  // TODO: Normalize this function.
  const fyo = doc.fyo;
  const target = doc.schemaName;

  const linkingFields = Object.values(fyo.schemaMap)
    .filter((sch) => !sch?.isSingle)
    .map((sch) => sch?.fields)
    .flat()
    .filter((f): f is Field => f?.fieldtype === 'Link' && f.target === target);

  const dynamicLinkingFields = Object.values(fyo.schemaMap)
    .filter((sch) => !sch?.isSingle)
    .map((sch) => sch?.fields)
    .flat()
    .filter((f): f is Field => f?.fieldtype === 'DynamicLink');

  type Detail = { name: string; created: string };
  type ChildEntryDetail = {
    name: string;
    parent: string;
    parentSchemaName: string;
  };
  const entries: Record<string, Detail[]> = {};
  const childEntries: Record<string, ChildEntryDetail[]> = {};

  for (const field of [linkingFields, dynamicLinkingFields].flat()) {
    if (!field.schemaName || !field.fieldname) {
      continue;
    }

    const fieldname = field.fieldname;
    const options: GetAllOptions = {
      filters: { [fieldname]: doc.name },
      fields: ['name'],
    };

    if (field.fieldtype === 'DynamicLink') {
      const dynamicField = field as unknown as Record<string, unknown>;
      const references = dynamicField.references;
      if (typeof references !== 'string') {
        continue;
      }
      options.filters![references] = doc.schemaName!;
    }

    const schema = fyo.schemaMap[field.schemaName];
    if (!schema) {
      continue;
    }

    const docs = await fyo.db.getAll(field.schemaName, options);
    for (const linkedDoc of docs) {
      const linkedRecord = linkedDoc as unknown as {
        name?: unknown;
        parent?: unknown;
        creation?: unknown;
      };
      const linkedName = linkedRecord.name;
      if (typeof linkedName !== 'string' || linkedName === doc.name) {
        continue;
      }

      if (schema.isChild) {
        const parent = linkedRecord.parent;
        if (typeof parent !== 'string') {
          continue;
        }

        const childDetails = childEntries[linkedName] ?? [];
        childDetails.push({
          name: linkedName,
          parent,
          parentSchemaName: schema.name,
        });
        childEntries[linkedName] = childDetails;
      } else {
        const creation = linkedRecord.creation;
        if (typeof creation !== 'string') {
          continue;
        }

        const entryDetails = entries[linkedName] ?? [];
        entryDetails.push({
          name: linkedName,
          created: creation,
        });
        entries[linkedName] = entryDetails;
      }
    }
  }

  return Object.fromEntries(
    Object.entries(entries).map(([name, details]) => [
      name,
      details.map(({ name }) => name),
    ])
  );
}
