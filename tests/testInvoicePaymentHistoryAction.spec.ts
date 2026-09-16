import test from 'tape';
import { Fyo } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { ModelNameEnum } from '../models/types';
import { SalesInvoice } from '../models/baseModels/SalesInvoice/SalesInvoice';

test('invoice payment history action: filters payments by invoice', async (t) => {
  const fyo = {
    t(strings: TemplateStringsArray, ...values: unknown[]) {
      return strings.reduce(
        (result, string, index) => result + string + (values[index] ?? ''),
        ''
      );
    },
  } as unknown as Fyo;

  const action = SalesInvoice.getActions(fyo).find(
    ({ label }) => label === 'View Payments'
  );
  t.ok(action, 'View Payments action exists');
  t.equal(
    action?.condition?.({ isSubmitted: true, name: 'SINV-001' } as Doc),
    true,
    'action is available for a submitted invoice'
  );
  t.equal(
    action?.condition?.({ isSubmitted: false, name: 'SINV-001' } as Doc),
    false,
    'action is hidden for an unsubmitted invoice'
  );

  let route: unknown;
  await action?.action?.(
    { isSubmitted: true, name: 'SINV-001' } as Doc,
    {
      push: async (value: unknown) => {
        route = value;
      },
    } as never
  );

  t.deepEqual(
    route,
    {
      path: '/list/Payment',
      query: {
        filters: JSON.stringify({
          referenceType: ModelNameEnum.SalesInvoice,
          referenceName: 'SINV-001',
        }),
      },
    },
    'action opens payments filtered to the selected invoice'
  );
  t.end();
});
