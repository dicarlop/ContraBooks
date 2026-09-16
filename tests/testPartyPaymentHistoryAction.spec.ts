import test from 'tape';
import { Fyo } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { Party } from '../models/baseModels/Party/Party';

test('party payment history action: filters payments by party', async (t) => {
  const fyo = {
    t(strings: TemplateStringsArray, ...values: unknown[]) {
      return strings.reduce(
        (result, string, index) => result + string + (values[index] ?? ''),
        ''
      );
    },
  } as unknown as Fyo;

  const action = Party.getActions(fyo).find(
    ({ label }) => label === 'View Payments'
  );
  t.ok(action, 'View Payments action exists');
  t.equal(
    action?.condition?.({ notInserted: false, name: 'CUST-001' } as Doc),
    true,
    'action is available for an existing party'
  );
  t.equal(
    action?.condition?.({ notInserted: true, name: 'CUST-001' } as Doc),
    false,
    'action is hidden for an unsaved party'
  );

  let route: unknown;
  await action?.action?.(
    { notInserted: false, name: 'CUST-001' } as Doc,
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
      query: { filters: JSON.stringify({ party: 'CUST-001' }) },
    },
    'action opens payments filtered to the selected party'
  );
  t.end();
});
