<template>
  <div class="dashboard-page h-full min-h-0 min-w-0 w-full">
    <header class="dashboard-topbar">
      <div class="top-spacer"></div>
      <div class="dashboard-top-actions">
        <button title="Notifications" class="top-action"><feather-icon name="bell"/><i class="notification-count">3</i></button>
        <button title="Help" class="top-action"><feather-icon name="help-circle"/></button>
        <div class="top-divider"></div>
        <div class="dashboard-avatar">{{ initials }}</div>
        <div class="user-copy"><b>{{ firstName }}</b><small>{{ companyName || 'Company file' }}</small></div>
        <div class="account-trigger-wrap">
          <button title="Account menu" class="account-trigger" :aria-expanded="accountMenuOpen" @click.stop="accountMenuOpen = !accountMenuOpen"><feather-icon name="chevron-down"/></button>
          <DashboardAccountMenu v-if="accountMenuOpen" :first-name="firstName" :initials="initials" :company-name="companyName" />
        </div>
        <button class="company-switch" title="Switch Company Database" @click="switchCompany"><feather-icon name="briefcase"/><span><b>Company</b><small>Switch Company Database</small></span><feather-icon name="chevron-down" class="company-chevron"/></button>
        <button class="theme-button" title="Toggle light/dark mode" :aria-pressed="darkMode" @click="toggleTheme"><feather-icon name="sun"/><span class="theme-track"><i :class="{ dark: darkMode }"><feather-icon name="moon"/></i></span></button>
      </div>
    </header>

    <div class="dashboard-scroll no-scrollbar">
      <main class="dashboard-content">
        <section class="dashboard-welcome">
          <h1>Dashboard</h1>
          <h2>Good morning, {{ firstName }}</h2>
          <p>Here's what's happening with your business today.</p>
        </section>

        <section class="kpi-grid">
          <article v-for="card in kpiCards" :key="card.label" :class="['dashboard-card', 'kpi-card', card.tone]">
            <div class="kpi-icon"><feather-icon :name="card.icon"/></div>
            <div class="kpi-copy">
              <span>{{ card.label }}</span>
              <strong>{{ formatCurrency(card.value) }}</strong>
              <small :class="card.changeTone">{{ card.change }} <em>vs. last month</em></small>
              <div class="sparkline"><i v-for="(height,index) in card.spark" :key="index" :style="{height: `${height}%`}"/></div>
            </div>
          </article>
        </section>

        <section class="workflow-card dashboard-card">
          <div class="workflow-heading">
            <div class="workflow-symbol"><feather-icon name="share-2"/></div>
            <div><h2>Desktop Pro Workflow</h2><p>Follow the accounting cycle</p></div>
          </div>
          <div class="workflow">
            <template v-for="(step,index) in workflowSteps" :key="step.label">
              <button class="workflow-step" :class="step.tone" @click="routeTo(step.path)">
                <span class="step-number">{{ step.number }}</span>
                <feather-icon :name="step.icon" class="step-icon"/>
                <b>{{ step.label }}</b>
                <small>{{ step.detail }}</small>
              </button>
              <feather-icon v-if="index < workflowSteps.length - 1" name="arrow-right" class="workflow-arrow"/>
            </template>
          </div>
        </section>

        <section class="dashboard-grid-middle">
          <article class="dashboard-card panel-card transactions-card">
            <div class="panel-heading"><div><h2><feather-icon name="file-text"/>Recent Transactions</h2></div><button @click="routeTo('/list/SalesInvoice')">View All</button></div>
            <div class="table-head transaction-columns"><span>Date</span><span>Description</span><span>Amount</span></div>
            <button v-for="row in recentTransactions" :key="row.id" class="table-row transaction-columns" @click="row.path && routeTo(row.path)">
              <span>{{ row.date }}</span><span>{{ row.description }}</span><strong :class="row.negative ? 'negative-amount' : 'positive-amount'">{{ formatCurrency(row.amount) }}</strong>
            </button>
          </article>

          <article class="dashboard-card panel-card cashflow-card">
            <div class="panel-heading"><div><h2><feather-icon name="clipboard"/>Bills &amp; Expenses Cashflow</h2></div><select aria-label="Cashflow period"><option>Last 6 Months</option><option>This Year</option></select></div>
            <div class="chart-legend"><span><i class="bill-dot"/>Bills</span><span><i class="expense-dot"/>Expenses</span><span><i class="cashflow-dot"/>Cashflow</span></div>
            <div class="cashflow-chart">
              <div class="chart-axis"><span>$12,000</span><span>$9,000</span><span>$6,000</span><span>$3,000</span><span>$0</span></div>
              <div class="chart-area">
                <div class="chart-grid-lines"><i/><i/><i/><i/><i/></div>
                <div v-for="bar in cashFlowBars" :key="bar.label" class="month-group">
                  <div class="bar-pair"><i class="bill-bar" :style="{height: `${bar.bill}%`}"/><i class="expense-bar" :style="{height: `${bar.expense}%`}"/></div>
                  <span>{{ bar.label }}</span>
                </div>
                <div class="cashflow-line"><i v-for="(bar,index) in cashFlowBars" :key="`line-${bar.label}`" :style="{left: `${8 + index * 17}%`, bottom: `${bar.line}%`}"/></div>
              </div>
            </div>
          </article>
        </section>

        <section class="dashboard-grid-bottom">
          <article class="dashboard-card panel-card list-card">
            <div class="panel-heading"><div><h2><feather-icon name="file-text"/>Financial Reports</h2></div><button @click="routeTo('/report/ProfitAndLoss')">View All</button></div>
            <div class="table-head report-columns"><span>Date</span><span>Description</span><span>Amount</span></div>
            <div v-for="row in financialRows" :key="row.date + row.description" class="table-row report-columns"><span>{{ row.date }}</span><span>{{ row.description }}</span><strong :class="row.negative ? 'negative-amount' : 'positive-amount'">{{ formatCurrency(row.amount) }}</strong></div>
          </article>
          <article class="dashboard-card panel-card list-card">
            <div class="panel-heading"><div><h2><feather-icon name="calendar"/>Upcoming Tasks</h2></div><button>View All</button></div>
            <div class="table-head task-columns"><span>Task</span><span>Due Date</span></div>
            <div v-for="task in tasks" :key="task.task" class="table-row task-columns"><span>{{ task.task }}</span><span>{{ task.date }}</span></div>
          </article>
        </section>
      </main>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import DashboardAccountMenu from 'src/components/DashboardAccountMenu.vue';
import { fyo } from 'src/initFyo';
import { docsPathRef } from 'src/utils/refs';
import { routeTo } from 'src/utils/ui';

type InvoiceRecord = Record<string, unknown>;
type TransactionRow = { id: string; date: string; description: string; amount: number; negative?: boolean; path?: string };
type FlowBar = { label: string; bill: number; expense: number; line: number };

export default defineComponent({
  name: 'Dashboard',
  components: { DashboardAccountMenu },
  props: { darkMode: { type: Boolean, default: false } },
  data() {
    return {
      accountMenuOpen: false,
      localDarkMode: false,
      companyName: '',
      income: 12480,
      expenses: 8230,
      bankBalance: 18750,
      outstandingInvoices: 6420,
      openBills: 4180,
      recentTransactions: [
        { id: 'demo-1', date: '2025-09-14', description: 'Invoice #1008 - ABC Corp', amount: 1250 },
        { id: 'demo-2', date: '2025-09-13', description: 'Payment - ABC Corp', amount: 1250 },
        { id: 'demo-3', date: '2025-09-12', description: 'Bill - Office Supplies', amount: 320, negative: true },
        { id: 'demo-4', date: '2025-09-11', description: 'Invoice #1007 - Maple Services', amount: 890 },
        { id: 'demo-5', date: '2025-09-10', description: 'Payment - Maple Services', amount: 890 },
      ] as TransactionRow[],
      cashFlowBars: [
        { label: 'Apr', bill: 55, expense: 46, line: 37 }, { label: 'May', bill: 51, expense: 55, line: 43 },
        { label: 'Jun', bill: 62, expense: 64, line: 42 }, { label: 'Jul', bill: 69, expense: 73, line: 50 },
        { label: 'Aug', bill: 91, expense: 84, line: 50 }, { label: 'Sep', bill: 100, expense: 82, line: 55 },
      ] as FlowBar[],
      financialRows: [
        { date: 'Sep 18, 2025', description: 'Customer Payment', amount: 1250 },
        { date: 'Sep 14, 2025', description: 'Bill Payment', amount: 845.20, negative: true },
        { date: 'Sep 13, 2025', description: 'Invoice #1043', amount: 2360 },
        { date: 'Sep 12, 2025', description: 'Office Supplies', amount: 189.56, negative: true },
        { date: 'Sep 11, 2025', description: 'Customer Payment', amount: 890 },
      ],
      tasks: [
        { task: 'Send invoice to ABC Corp', date: '2025-09-16' }, { task: 'Pay Office Supplies bill', date: '2025-09-17' },
        { task: 'Reconcile Bank Account', date: '2025-09-18' }, { task: 'Prepare monthly reports', date: '2025-09-20' },
        { task: 'Follow up with Maple Services', date: '2025-09-22' },
      ],
      workflowSteps: [
        { number: 1, label: 'Customers & Sales', detail: 'Create invoices · Receive payments', icon: 'users', tone: 'blue', path: '/list/SalesInvoice' },
        { number: 2, label: 'Receive Payments', detail: 'Apply payments · Track receivables', icon: 'credit-card', tone: 'teal', path: '/list/Payment' },
        { number: 3, label: 'Vendors & Bills', detail: 'Enter bills · Pay vendors and manage purchases', icon: 'file-text', tone: 'purple', path: '/list/PurchaseInvoice' },
        { number: 4, label: 'Banking', detail: 'Reconcile accounts · Manage transactions', icon: 'home', tone: 'blue', path: '/list/BankReconciliation' },
        { number: 5, label: 'Accounting', detail: 'Journal entries · Adjustments', icon: 'book-open', tone: 'orange', path: '/list/JournalEntry' },
        { number: 6, label: 'Reports', detail: 'Financial statements · Business insights', icon: 'bar-chart-2', tone: 'teal', path: '/report/ProfitAndLoss' },
      ],
    };
  },
  computed: {
    darkMode(): boolean { return this.localDarkMode; },
    firstName(): string {
      const name = this.$route.query?.name;
      return typeof name === 'string' && name ? name : 'TTheore';
    },
    initials(): string { return this.firstName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'T'; },
    kpiCards(): Array<{ label: string; value: number; change: string; changeTone: string; icon: string; tone: string; spark: number[] }> {
      return [
        { label: 'Total Income', value: this.income, change: '↑ 12%', changeTone: 'positive', icon: 'dollar-sign', tone: 'income', spark: [30, 37, 26, 42, 36, 52, 44, 58, 50, 66, 58, 76] },
        { label: 'Total Expenses', value: this.expenses, change: '↓ 5%', changeTone: 'positive', icon: 'credit-card', tone: 'expense', spark: [31, 46, 35, 51, 39, 55, 47, 61, 53, 68, 58, 74] },
        { label: 'Bank Balance', value: this.bankBalance, change: '↑ 8%', changeTone: 'positive', icon: 'home', tone: 'bank', spark: [25, 34, 29, 44, 37, 53, 45, 59, 50, 67, 60, 78] },
        { label: 'Outstanding Invoices', value: this.outstandingInvoices, change: '↓ 14%', changeTone: 'positive', icon: 'file-text', tone: 'invoice', spark: [27, 38, 31, 45, 36, 52, 43, 58, 50, 65, 56, 73] },
        { label: 'Open Bills', value: this.openBills, change: '↓ 6%', changeTone: 'open-bills-change', icon: 'file-text', tone: 'bills', spark: [25, 32, 28, 39, 33, 48, 42, 55, 49, 60, 54, 70] },
      ];
    },
  },
  async activated() { docsPathRef.value = 'books/dashboard'; await this.loadDashboardData(); this.syncTheme(); },
  deactivated() { docsPathRef.value = ''; },
  methods: {
    routeTo,
    switchCompany() { window.dispatchEvent(new CustomEvent('contrabooks:switch-company')); },
    syncTheme() {
      const stored = localStorage.getItem('contrabooks-theme');
      this.localDarkMode = stored === 'dark';
      document.documentElement.classList.toggle('dark', this.localDarkMode);
    },
    toggleTheme() {
      this.localDarkMode = !this.localDarkMode;
      localStorage.setItem('contrabooks-theme', this.localDarkMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', this.localDarkMode);
      window.dispatchEvent(new CustomEvent('contrabooks:theme-change', { detail: { dark: this.localDarkMode } }));
    },
    async loadDashboardData() {
      this.companyName = String(fyo.singles.AccountingSettings?.companyName ?? 'Maple Ridge Business Solutions Inc.');
      try {
        const invoices = await fyo.db.getAllRaw('SalesInvoice', { fields: ['name', 'party', 'date', 'grandTotal', 'outstandingAmount', 'submitted', 'cancelled'], orderBy: 'date', order: 'desc', limit: 5 }) as InvoiceRecord[];
        if (invoices.length) {
          this.income = invoices.filter(r => r.submitted === true && r.cancelled !== true).reduce((sum, r) => sum + Number(r.grandTotal ?? 0), 0) || this.income;
          this.outstandingInvoices = invoices.reduce((sum, r) => sum + Number(r.outstandingAmount ?? 0), 0) || this.outstandingInvoices;
          this.recentTransactions = invoices.map((r, index) => ({
            id: String(r.name ?? index), date: this.formatDate(r.date), description: `Invoice ${String(r.name ?? '')} - ${String(r.party ?? 'Customer')}`, amount: Number(r.grandTotal ?? 0), path: r.name ? `/edit/SalesInvoice/${String(r.name)}` : undefined,
          }));
        }
        const purchases = await fyo.db.getAllRaw('PurchaseInvoice', { fields: ['grandTotal', 'outstandingAmount', 'submitted', 'cancelled'] }) as InvoiceRecord[];
        if (purchases.length) {
          this.expenses = purchases.filter(r => r.submitted === true && r.cancelled !== true).reduce((sum, r) => sum + Number(r.grandTotal ?? 0), 0) || this.expenses;
          this.openBills = purchases.reduce((sum, r) => sum + Number(r.outstandingAmount ?? 0), 0) || this.openBills;
        }
      } catch { /* Keep the reference dashboard populated while a new company file is initializing. */ }
    },
    formatCurrency(value: number) { return fyo.format(Number(value || 0), 'Currency'); },
    formatDate(value: unknown) {
      if (!value) return '—';
      const date = new Date(value as string | number | Date);
      return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
    },
  },
});
</script>

<style scoped>
.dashboard-page{display:flex;flex-direction:column;background:#F5F9FC;color:#07345C;overflow:hidden}.dashboard-topbar{height:50px;flex:0 0 50px;display:flex;align-items:center;padding:0 14px 0 20px;background:#fff;border-bottom:1px solid #DCE7EF}.top-spacer{flex:1}.dashboard-top-actions{display:flex;align-items:center;gap:5px}.top-action,.account-trigger{position:relative;width:34px;height:34px;display:grid;place-items:center;border:0;border-radius:7px;background:transparent;color:#075A9B;cursor:pointer}.top-action:hover,.account-trigger:hover{background:#EAF6FC}.top-action svg,.account-trigger svg{width:18px!important;height:18px!important}.notification-count{position:absolute;top:0;right:0;min-width:15px;height:15px;border-radius:9px;background:#E5484D;color:#fff;font-size:8px;font-style:normal;display:grid;place-items:center}.top-divider{height:28px;width:1px;background:#DCE7EF;margin:0 6px}.dashboard-avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#07345C;color:#fff;font-size:11px;font-weight:700}.user-copy{display:flex;flex-direction:column;gap:1px;min-width:135px}.user-copy b{font-size:11px;color:#07345C}.user-copy small{font-size:8px;color:#527391;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.account-trigger-wrap{position:relative}.company-switch{height:40px;min-width:225px;display:flex;align-items:center;gap:8px;padding:0 10px;border:1px solid #DCE7EF;border-radius:8px;background:#fff;color:#07345C;text-align:left;cursor:pointer}.company-switch>svg:first-child{width:18px!important;height:18px!important}.company-switch span{display:flex;flex-direction:column;gap:1px;flex:1}.company-switch b{font-size:10px;font-weight:700}.company-switch small{font-size:8px;color:#527391}.company-switch .company-chevron{width:13px!important;height:13px!important}.theme-button{height:34px;display:flex;align-items:center;gap:4px;padding:0 4px 0 7px;border:0;border-radius:17px;background:#EAF0F5;color:#07345C;cursor:pointer}.theme-button>svg{width:15px!important;height:15px!important}.theme-track{width:42px;height:24px;display:flex;align-items:center;padding:2px;border-radius:13px;background:#07345C}.theme-track i{width:20px;height:20px;display:grid;place-items:center;border-radius:50%;background:#fff;color:#07345C;transform:translateX(0);transition:transform .15s}.theme-track i.dark{transform:translateX(18px);background:#18C6D3;color:#07345C}.theme-track i svg{width:12px!important;height:12px!important}.dashboard-scroll{min-height:0;flex:1;overflow:hidden}.dashboard-content{height:100%;box-sizing:border-box;padding:10px 20px 12px;display:grid;grid-template-rows:74px 164px 187px minmax(205px,1fr) 192px;gap:10px;overflow:hidden}.dashboard-welcome{padding:4px 6px;display:flex;flex-direction:column;justify-content:center}.dashboard-welcome h1{margin:0 0 3px;font-size:31px;line-height:1;font-weight:700;color:#07345C}.dashboard-welcome h2{margin:0;font-size:23px;line-height:1.1;font-weight:700;color:#07345C}.dashboard-welcome p{margin:5px 0 0;font-size:13px;color:#37709B}.kpi-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.dashboard-card{border:1px solid #DCE7EF;border-radius:9px;background:#fff;box-sizing:border-box;box-shadow:0 2px 9px rgba(7,52,92,.04)}.kpi-card{height:100%;display:flex;gap:12px;padding:12px 13px;overflow:hidden}.kpi-icon{width:41px;height:41px;flex:0 0 41px;display:grid;place-items:center;border-radius:50%;color:#fff}.kpi-icon svg{width:19px!important;height:19px!important}.income .kpi-icon{background:#10A874}.expense .kpi-icon{background:#E5484D}.bank .kpi-icon{background:#1689D5}.invoice .kpi-icon{background:#635BDB}.bills .kpi-icon{background:#F59E0B}.kpi-copy{min-width:0;display:flex;flex-direction:column;flex:1}.kpi-copy>span{font-size:12px;font-weight:700;color:#07345C;white-space:nowrap}.kpi-copy strong{margin-top:8px;font-size:20px;line-height:1;font-weight:700;color:#07345C;white-space:nowrap}.kpi-copy>small{margin-top:8px;font-size:10px;font-weight:700}.kpi-copy small em{font-style:normal;color:#527391;font-weight:400}.positive{color:#10A874}.open-bills-change{color:#F59E0B}.sparkline{height:30px;display:flex;align-items:flex-end;gap:3px;margin-top:auto;padding-top:5px}.sparkline i{flex:1;min-width:3px;border-radius:3px 3px 0 0;background:#10A874;opacity:.9}.expense .sparkline i{background:#E5484D}.bank .sparkline i{background:#1689D5}.invoice .sparkline i{background:#635BDB}.bills .sparkline i{background:#F59E0B}.workflow-card{padding:12px 16px}.workflow-heading{height:40px;display:flex;align-items:center;gap:10px}.workflow-symbol{width:34px;height:34px;display:grid;place-items:center;color:#00AFC1}.workflow-symbol svg{width:31px!important;height:31px!important}.workflow-heading h2{margin:0;font-size:16px;line-height:1.1;color:#07345C}.workflow-heading p{margin:3px 0 0;font-size:10px;color:#527391}.workflow{height:116px;display:grid;grid-template-columns:minmax(0,1fr) 20px minmax(0,1fr) 20px minmax(0,1fr) 20px minmax(0,1fr) 20px minmax(0,1fr) 20px minmax(0,1fr);align-items:center;gap:0}.workflow-step{height:116px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 12px;border:1px solid #1689D5;border-radius:9px;background:#F5FBFE;color:#07345C;cursor:pointer}.workflow-step:hover{background:#EAF6FC}.step-number{position:absolute;top:9px;left:9px;width:27px;height:27px;display:grid;place-items:center;border-radius:50%;background:#1689D5;color:#fff;font-size:11px;font-weight:700}.step-icon{width:28px!important;height:28px!important;margin-bottom:7px;color:#1689D5}.workflow-step b{font-size:12px;line-height:1.15;text-align:center}.workflow-step small{margin-top:6px;font-size:9px;line-height:1.35;color:#37709B;text-align:center;max-width:170px}.workflow-step.teal{border-color:#00AFC1;background:#F1FCFB}.workflow-step.teal .step-icon{color:#00AFC1}.workflow-step.teal .step-number{background:#00AFC1}.workflow-step.purple{border-color:#635BDB;background:#F8F5FF}.workflow-step.purple .step-icon{color:#635BDB}.workflow-step.purple .step-number{background:#635BDB}.workflow-step.orange{border-color:#F59E0B;background:#FFFAEF}.workflow-step.orange .step-icon{color:#F59E0B}.workflow-step.orange .step-number{background:#F59E0B}.workflow-arrow{width:16px!important;height:16px!important;color:#1689D5;justify-self:center}.dashboard-grid-middle,.dashboard-grid-bottom{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;min-height:0}.panel-card{padding:12px 12px 8px;min-width:0;min-height:0;overflow:hidden}.panel-heading{height:31px;display:flex;align-items:center;justify-content:space-between;gap:10px}.panel-heading h2{margin:0;display:flex;align-items:center;gap:9px;font-size:14px;color:#07345C}.panel-heading h2 svg{width:19px!important;height:19px!important}.panel-heading button{border:0;background:transparent;color:#0072CE;font-size:9px;cursor:pointer}.panel-heading select{height:28px;padding:0 9px;border:1px solid #CDE7EF;border-radius:6px;background:#fff;color:#07345C;font-size:9px}.table-head{display:grid;align-items:center;height:27px;border-bottom:1px solid #DCE7EF;color:#527391;font-size:9px}.table-row{display:grid;align-items:center;height:27px;border:0;border-bottom:1px solid #EAF0F5;background:#fff;color:#315D7D;text-align:left;font-size:9px}.transaction-columns{grid-template-columns:105px 1fr 75px}.transaction-columns strong,.report-columns strong{text-align:right}.table-row:hover{background:#F5FAFC}.positive-amount{color:#10A874;font-weight:700}.negative-amount{color:#E5484D;font-weight:700}.cashflow-card{padding-bottom:10px}.chart-legend{height:25px;display:flex;justify-content:flex-end;align-items:center;gap:17px;color:#527391;font-size:9px}.chart-legend span{display:flex;align-items:center;gap:5px}.chart-legend i{width:8px;height:8px;border-radius:50%;display:inline-block}.bill-dot{background:#1689D5}.expense-dot{background:#10A874}.cashflow-dot{background:#07345C;border:2px solid #fff;box-shadow:0 0 0 1px #07345C}.cashflow-chart{height:calc(100% - 57px);min-height:125px;display:flex}.chart-axis{width:46px;display:flex;flex-direction:column;justify-content:space-between;padding:5px 6px 20px 0;color:#527391;font-size:9px;text-align:right}.chart-area{position:relative;flex:1;border-left:1px solid #DCE7EF;border-bottom:1px solid #DCE7EF;display:flex}.chart-grid-lines{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none}.chart-grid-lines i{border-top:1px solid #EAF0F5}.month-group{position:relative;z-index:2;width:16.666%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end}.bar-pair{height:78%;display:flex;align-items:flex-end;gap:4px}.bar-pair i{width:18px;border-radius:3px 3px 0 0}.bill-bar{background:#1689D5}.expense-bar{background:#10A874}.month-group>span{margin-top:6px;font-size:9px;color:#527391}.cashflow-line{position:absolute;inset:0;z-index:3;pointer-events:none}.cashflow-line:before{content:"";position:absolute;left:8%;right:7%;bottom:50%;height:2px;background:#07345C;transform:rotate(2deg);transform-origin:center;opacity:.9}.cashflow-line i{position:absolute;width:7px;height:7px;border-radius:50%;background:#07345C;border:2px solid #fff;transform:translate(-50%,50%)}.report-columns{grid-template-columns:145px 1fr 75px}.task-columns{grid-template-columns:1fr 145px}.dashboard-grid-bottom .table-row{height:27px}.dashboard-grid-bottom .panel-card{padding-top:10px}
:global(html.dark) .dashboard-page{background:#031B2A;color:#EAF7FF}:global(html.dark) .dashboard-topbar{background:#031B2A;border-bottom-color:#173B57}:global(html.dark) .top-action,:global(html.dark) .account-trigger{color:#BFE8F7}:global(html.dark) .top-action:hover,:global(html.dark) .account-trigger:hover{background:#0C3148}:global(html.dark) .top-divider{background:#173B57}:global(html.dark) .user-copy b,:global(html.dark) .dashboard-welcome h1,:global(html.dark) .dashboard-welcome h2,:global(html.dark) .kpi-copy>span,:global(html.dark) .kpi-copy strong,:global(html.dark) .workflow-heading h2,:global(html.dark) .panel-heading h2{color:#F2FAFF}:global(html.dark) .user-copy small,:global(html.dark) .dashboard-welcome p,:global(html.dark) .workflow-heading p,:global(html.dark) .workflow-step small,:global(html.dark) .table-head,:global(html.dark) .table-row{color:#9FC5D8}:global(html.dark) .company-switch{background:#08263B;border-color:#1B4968;color:#EAF7FF}:global(html.dark) .company-switch small{color:#9FC5D8}:global(html.dark) .theme-button{background:#0D344B;color:#D8F2FA}:global(html.dark) .dashboard-card{background:#08263B;border-color:#1B4968;box-shadow:0 4px 14px rgba(0,0,0,.2)}:global(html.dark) .kpi-copy small em{color:#8EB3C8}:global(html.dark) .workflow-step{background:#0A3047;border-color:#1689D5;color:#F2FAFF}:global(html.dark) .workflow-step:hover{background:#103A54}:global(html.dark) .workflow-step.teal{background:#083A42}:global(html.dark) .workflow-step.purple{background:#211D46}:global(html.dark) .workflow-step.orange{background:#3C3015}:global(html.dark) .panel-heading select{background:#0B2D45;border-color:#28536C;color:#EAF7FF}:global(html.dark) .table-row{background:#08263B;border-bottom-color:#173B57}:global(html.dark) .table-row:hover{background:#0D344C}:global(html.dark) .table-head{border-bottom-color:#173B57}:global(html.dark) .chart-grid-lines i{border-color:#173B57}:global(html.dark) .chart-area{border-color:#28536C}:global(html.dark) .chart-axis,:global(html.dark) .month-group>span,:global(html.dark) .chart-legend{color:#8EB3C8}:global(html.dark) .cashflow-line:before{background:#DDF3FC}:global(html.dark) .cashflow-line i{background:#DDF3FC;border-color:#08263B}:global(html.dark) .cashflow-dot{background:#DDF3FC;box-shadow:0 0 0 1px #DDF3FC}:global(html.dark) .positive-amount{color:#18C6A8}:global(html.dark) .negative-amount{color:#FF6670}
@media(max-height:850px){.dashboard-content{grid-template-rows:65px 150px 171px minmax(185px,1fr) 170px;gap:8px;padding:8px 16px 9px}.dashboard-welcome h1{font-size:28px}.dashboard-welcome h2{font-size:20px}.kpi-card{padding:10px}.kpi-copy strong{font-size:18px}.workflow-card{padding:10px 12px}.workflow{height:105px}.workflow-step{height:105px}.workflow-step small{font-size:8px}.panel-card{padding:9px}.table-row,.table-head{height:25px}.dashboard-grid-bottom .table-row{height:25px}}
@media(max-width:1150px){.company-switch{min-width:190px}.user-copy{min-width:100px}.kpi-grid{gap:8px}.kpi-card{gap:8px}.kpi-copy>span{font-size:10px}.kpi-copy strong{font-size:17px}.workflow{grid-template-columns:repeat(3,minmax(0,1fr));height:auto;gap:7px}.workflow-arrow{display:none}.workflow-step{height:52px;display:grid;grid-template-columns:25px 24px 1fr;grid-template-rows:1fr 1fr;gap:0 6px;padding:5px 7px;text-align:left}.step-number{position:static;grid-row:1 / 3}.step-icon{width:19px!important;height:19px!important;margin:0;grid-row:1 / 3}.workflow-step b,.workflow-step small{text-align:left;max-width:none;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.workflow-step b{align-self:end}.workflow-step small{align-self:start;margin-top:2px}.workflow-card{padding-bottom:9px}.workflow-heading{height:33px}}
@media(max-width:850px){.dashboard-content{height:auto;min-height:100%;grid-template-rows:auto auto auto auto auto;overflow:auto}.dashboard-scroll{overflow:auto}.kpi-grid,.dashboard-grid-middle,.dashboard-grid-bottom{grid-template-columns:1fr 1fr}.kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.company-switch,.user-copy{display:none}.workflow{grid-template-columns:1fr 1fr}.dashboard-top-actions{gap:2px}}
</style>
