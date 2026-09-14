<template>
  <div class="h-screen bg-[#F8FAFC]" style="width: var(--w-desk)">
    <PageHeader :title="''" class="dashboard-header">
      <div class="dashboard-period">
        <PeriodSelector
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
      <div class="dashboard-shell">
        <div class="dashboard-main">
          <header class="dashboard-welcome">
            <div>
              <h1>Good afternoon, {{ firstName }}</h1>
              <p>Here's what's happening with your business today.</p>
            </div>
            <div class="dashboard-date">{{ formattedDate }}</div>
          </header>

          <div class="dashboard-kpis">
            <section class="dashboard-card dashboard-kpi dashboard-kpi-blue">
              <div class="dashboard-kpi-icon">$</div>
              <div>
                <div class="dashboard-kpi-label">Outstanding Invoices</div>
                <div class="dashboard-kpi-value"><UnpaidInvoices :schema-name="'SalesInvoice'" :common-period="period" :dark-mode="false" /></div>
              </div>
            </section>
            <section class="dashboard-card dashboard-kpi dashboard-kpi-green">
              <div class="dashboard-kpi-icon">$</div>
              <div>
                <div class="dashboard-kpi-label">Outstanding Bills</div>
                <div class="dashboard-kpi-value"><UnpaidInvoices :schema-name="'PurchaseInvoice'" :common-period="period" :dark-mode="false" /></div>
              </div>
            </section>
            <section class="dashboard-card dashboard-kpi dashboard-kpi-purple">
              <div class="dashboard-kpi-icon">◎</div>
              <div>
                <div class="dashboard-kpi-label">Total Customers</div>
                <div class="dashboard-kpi-value">&mdash;</div>
              </div>
            </section>
            <section class="dashboard-card dashboard-kpi dashboard-kpi-teal">
              <div class="dashboard-kpi-icon">□</div>
              <div>
                <div class="dashboard-kpi-label">Total Suppliers</div>
                <div class="dashboard-kpi-value">&mdash;</div>
              </div>
            </section>
          </div>

          <section class="dashboard-card dashboard-chart-card">
            <Cashflow
              :common-period="period"
              :dark-mode="false"
              @period-change="handlePeriodChange"
            />
          </section>

          <div class="dashboard-lower-grid">
            <section class="dashboard-card dashboard-panel">
              <ProfitAndLoss
                :common-period="period"
                :dark-mode="false"
                @period-change="handlePeriodChange"
              />
            </section>
            <section class="dashboard-card dashboard-panel">
              <Expenses
                :common-period="period"
                :dark-mode="false"
                @period-change="handlePeriodChange"
              />
            </section>
          </div>
        </div>

        <aside class="dashboard-rail">
          <h2>Quick Actions</h2>
          <button class="quick-action quick-action-blue" @click="routeTo('/list/SalesInvoice')">
            <span class="quick-action-icon">▤</span><span>Invoices</span><span class="quick-action-arrow">›</span>
          </button>
          <button class="quick-action quick-action-green" @click="routeTo('/list/Party/Customers')">
            <span class="quick-action-icon">●</span><span>Customers</span><span class="quick-action-arrow">›</span>
          </button>
          <button class="quick-action quick-action-teal" @click="routeTo('/list/Payment')">
            <span class="quick-action-icon">▣</span><span>Payments</span><span class="quick-action-arrow">›</span>
          </button>
          <button class="quick-action quick-action-purple" @click="routeTo('/list/PurchaseInvoice')">
            <span class="quick-action-icon">▤</span><span>Bills</span><span class="quick-action-arrow">›</span>
          </button>
          <button class="quick-action quick-action-navy" @click="routeTo('/report/GeneralLedger')">
            <span class="quick-action-icon">▥</span><span>View Reports</span><span class="quick-action-arrow">›</span>
          </button>

          <section class="dashboard-tip">
            <div class="dashboard-tip-icon">✓</div>
            <h3>Keep your books in balance</h3>
            <p>Track income, manage expenses, and grow your business — all in one place.</p>
            <button @click="routeTo('/get-started')">Get started</button>
          </section>
        </aside>
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
import { routeTo } from 'src/utils/ui';

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
  computed: {
    firstName() {
      const name = this.$route.query?.name;
      return typeof name === 'string' && name ? name : 'there';
    },
    formattedDate() {
      return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
    },
  },
  activated() {
    docsPathRef.value = 'books/dashboard';
  },
  deactivated() {
    docsPathRef.value = '';
  },
  methods: {
    routeTo,
    handlePeriodChange(period) {
      if (period === this.period) return;
      this.period = period;
    },
  },
};
</script>

<style scoped>
.dashboard-header {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.dashboard-period {
  border: 1px solid #dbeafe;
  border-radius: 10px;
  background: #ffffff;
  padding: 0 8px;
}

.dashboard-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 18px;
  padding: 22px 24px 28px;
  min-width: 980px;
}

.dashboard-main {
  min-width: 0;
}

.dashboard-welcome {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.dashboard-welcome h1 {
  margin: 0;
  color: #0f172a;
  font-size: 30px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.dashboard-welcome p {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 15px;
}

.dashboard-date {
  color: #2563eb;
  font-size: 13px;
  white-space: nowrap;
  padding-bottom: 3px;
}

.dashboard-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.dashboard-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.05);
}

.dashboard-kpi {
  min-height: 118px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.dashboard-kpi-blue { border-color: #bfdbfe; background: #f8fbff; }
.dashboard-kpi-green { border-color: #a7f3d0; background: #f5fffb; }
.dashboard-kpi-purple { border-color: #ddd6fe; background: #fbf9ff; }
.dashboard-kpi-teal { border-color: #a5f3fc; background: #f4feff; }

.dashboard-kpi-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: #ffffff;
  background: #2563eb;
  font-size: 21px;
  font-weight: 700;
}

.dashboard-kpi-green .dashboard-kpi-icon { background: #10b981; }
.dashboard-kpi-purple .dashboard-kpi-icon { background: #7c3aed; }
.dashboard-kpi-teal .dashboard-kpi-icon { background: #06b6d4; }

.dashboard-kpi-label { color: #2563eb; font-size: 12px; font-weight: 600; }
.dashboard-kpi-green .dashboard-kpi-label { color: #059669; }
.dashboard-kpi-purple .dashboard-kpi-label { color: #6d28d9; }
.dashboard-kpi-teal .dashboard-kpi-label { color: #0891b2; }
.dashboard-kpi-value { color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 6px; }
.dashboard-kpi-value :deep(.p-4) { padding: 0 !important; }
.dashboard-kpi-value :deep(.mt-4) { margin-top: 0 !important; }
.dashboard-kpi-value :deep(.text-sm) { font-size: 14px; }

.dashboard-chart-card {
  min-height: 310px;
  overflow: hidden;
  padding: 4px;
  margin-bottom: 14px;
}

.dashboard-lower-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.dashboard-panel {
  min-height: 250px;
  overflow: hidden;
  padding: 4px;
}

.dashboard-rail h2 {
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  margin: 4px 0 10px;
}

.quick-action {
  width: 100%;
  height: 54px;
  margin-bottom: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  color: #0f172a;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 3px 12px rgba(15, 23, 42, 0.04);
  cursor: pointer;
}

.quick-action-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  color: #ffffff;
  background: #2563eb;
}
.quick-action-green .quick-action-icon { background: #10b981; }
.quick-action-teal .quick-action-icon { background: #06b6d4; }
.quick-action-purple .quick-action-icon { background: #7c3aed; }
.quick-action-navy .quick-action-icon { background: #0f172a; }
.quick-action-arrow { margin-left: auto; color: #2563eb; font-size: 20px; }

.dashboard-tip {
  margin-top: 16px;
  padding: 18px 14px;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%);
  text-align: center;
}

.dashboard-tip-icon {
  width: 54px;
  height: 54px;
  margin: 0 auto 12px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #d1fae5;
  color: #059669;
  font-size: 25px;
  font-weight: 700;
}

.dashboard-tip h3 { margin: 0; color: #0f172a; font-size: 17px; line-height: 1.25; }
.dashboard-tip p { margin: 9px 0 14px; color: #64748b; font-size: 11px; line-height: 1.5; }
.dashboard-tip button { width: 100%; height: 36px; border: 0; border-radius: 9px; background: #2563eb; color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; }
</style>
