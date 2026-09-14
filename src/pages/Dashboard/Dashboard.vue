<template>
  <div class="h-screen" style="width: var(--w-desk)">
    <PageHeader :title="t`Dashboard`">
      <div class="border dark:border-gray-900 rounded-lg bg-gray-50 dark:bg-gray-890 focus-within:bg-gray-100 dark:focus-within:bg-gray-900 flex items-center shadow-sm">
        <PeriodSelector
          class="px-3"
          :value="period"
          :options="['This Year', 'This Quarter', 'This Month', 'YTD']"
          @change="(value) => (period = value)"
        />
      </div>
    </PageHeader>

    <div class="no-scrollbar overflow-auto bg-gray-50 dark:bg-gray-875" style="height: calc(100vh - var(--h-row-largest) - 1px)">
      <div style="min-width: var(--w-desk-fixed)" class="p-4 space-y-4">
        <section class="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Cashflow
            :common-period="period"
            :dark-mode="darkMode"
            class="p-4"
            @period-change="handlePeriodChange"
          />
        </section>

        <div class="grid grid-cols-2 gap-4">
          <section class="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <UnpaidInvoices
              :schema-name="'SalesInvoice'"
              :common-period="period"
              :dark-mode="darkMode"
              @period-change="handlePeriodChange"
            />
          </section>
          <section class="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <UnpaidInvoices
              :schema-name="'PurchaseInvoice'"
              :common-period="period"
              :dark-mode="darkMode"
              @period-change="handlePeriodChange"
            />
          </section>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <section class="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <ProfitAndLoss
              class="p-4"
              :common-period="period"
              :dark-mode="darkMode"
              @period-change="handlePeriodChange"
            />
          </section>
          <section class="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <Expenses
              class="p-4"
              :common-period="period"
              :dark-mode="darkMode"
              @period-change="handlePeriodChange"
            />
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PageHeader from 'src/components/PageHeader.vue';
import UnpaidInvoices from './UnpaidInvoices.vue';
import Cashflow from './Cashflow.vue';
import Expenses from './Expenses.vue';
import PeriodSelector from './PeriodSelector.vue';
import ProfitAndLoss from './ProfitAndLoss.vue';
import { docsPathRef } from 'src/utils/refs';

export default {
  name: 'Dashboard',
  components: {
    PageHeader,
    Cashflow,
    ProfitAndLoss,
    Expenses,
    PeriodSelector,
    UnpaidInvoices,
  },
  props: {
    darkMode: { type: Boolean, default: false },
  },
  data() {
    return { period: 'This Year' };
  },
  activated() {
    docsPathRef.value = 'books/dashboard';
  },
  deactivated() {
    docsPathRef.value = '';
  },
  methods: {
    handlePeriodChange(period) {
      if (period === this.period) {
        return;
      }

      this.period = '';
    },
  },
};
</script>
