import { Fyo } from 'fyo';
import { Action } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';

export function getViewPaymentsAction(fyo: Fyo): Action {
  return {
    label: fyo.t`View Payments`,
    group: fyo.t`View`,
    condition: (doc) => doc.isSubmitted,
    action: async (doc, router) => {
      await router.push({
        path: `/list/${ModelNameEnum.Payment}`,
        query: {
          filters: JSON.stringify({
            referenceType: doc.schemaName,
            referenceName: doc.name,
          }),
        },
      });
    },
  };
}
