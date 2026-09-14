<template>
  <div class="h-screen bg-[#F8FAFC]" style="width: var(--w-desk)">
    <PageHeader :title="t`Dashboard`" class="bg-white">
      <div class="rounded-lg border border-slate-200 bg-white shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 flex items-center">
        <PeriodSelector
          class="px-3"
          :value="period"
          :options="['This Year', 'This Quarter', 'This Month', 'YTD']"
          @change="(value) => (period = value)"
        />
      </div>
    </PageHeader>

    <div
      class="no-scrollbar overflow-auto bg-[#F8FAFC]"
      style="height: calc(100vh - var(--h-row-largest) - 1px)"
    >
      <div style="min-width: var(--w-desk-fixed)" class="p-5 space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <section class="dashboard-card border-blue-100 bg-white">
            <UnpaidInvoices
              :schema-name="'SalesInvoice'"
              :common-period="period"
              :dark-mode="false"
              @period-change="handlePeriodChange"
            />
          </section>
          <section class="dashboard-card border-emerald-100 bg-white">
            <UnpaidInvoices
              :schema-name="'PurchaseInvoice'"
              :common-period="period"
              :dark-mode="false"
              @period-change="handlePeriodChange"
            />
          </section>
        </div>

        <section class="dashboard-card border-slate-200 bg-white overflow-hidden">
          <Cashflow
            :common-period="period"
            :dark-mode="false"
            class="p-1"
            @period-change="handlePeriodChange"
          />
        </section>

        <div class="grid grid-cols-2 gap-4">
          <section class="dashboard-card border-slate-200 bg-white">
            <ProfitAndLoss
              class="p-1"
              :common-period="period"
              :dark-mode="false"
              @period-change="handlePeriodChange"
            />
          </section>
          <section class="dashboard-card border-slate-200 bg-white">
            <Expenses
              class="p-1"
              :common-period="period"
              :dark-mode="false"
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

<style scoped>
.dashboard-card {
  border-width: 1px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.dashboard-card :deep(.text-gray-900) {
  color: #0f172a;
}

.dashboard-card :deep(.text-gray-700) {
  color: #475569;
}
</style>
