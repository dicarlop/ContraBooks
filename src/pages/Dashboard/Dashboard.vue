<template>
  <div class="dashboard-page h-full min-h-0 min-w-0 w-full">
    <header class="dashboard-topbar">
      <div class="dashboard-search">
        <feather-icon name="search" class="h-4 w-4" />
        <input v-model="searchQuery" aria-label="Search" :placeholder="searchPlaceholder" @keydown="handleSearchKeydown" />
        <span>Ctrl K</span>
      </div>
      <div class="title-greeting">
        <strong>Good morning, {{ companyName }}</strong>
        <span>Here's what's happening with your business today.</span>
      </div>
      <div class="top-actions">
        <button class="top-icon" title="Notifications" type="button">
          <feather-icon name="bell" />
          <i>3</i>
        </button>
        <button class="top-icon" title="Help" type="button">
          <feather-icon name="help-circle" />
        </button>
        <span class="divider"></span>
        <div class="avatar">{{ initials }}</div>
        <div class="user-copy">
          <b>{{ companyName }}</b>
          <small>Current company</small>
        </div>
        <div class="account-wrap">
          <button class="account-button" title="Account menu" type="button" :aria-expanded="accountMenuOpen" @click.stop="accountMenuOpen = !accountMenuOpen">
            <feather-icon name="chevron-down" />
          </button>
          <DashboardAccountMenu v-if="accountMenuOpen" :first-name="companyName" :initials="initials" :company-name="companyName" />
        </div>
      </div>
    </header>

    <div class="dashboard-scroll">
      <main class="dashboard-content">
        <section class="kpis">
          <article v-for="card in kpiCards" :key="card.label" class="card kpi" :class="card.tone">
            <span class="kpi-icon"><feather-icon :name="card.icon" /></span>
            <div class="kpi-copy">
              <b>{{ card.label }}</b>
              <strong>{{ money(card.value) }}</strong>
              <small :class="card.changeClass">{{ card.change }} <em>vs. last month</em></small>
              <span class="spark"><i v-for="(height, index) in card.spark" :key="index" :style="{ height: `${height}%` }"></i></span>
            </div>
          </article>
        </section>

        <section class="card workflow-card">
          <div class="workflow-title"><feather-icon name="share-2" /><div><h2>Desktop Pro Workflow</h2><p>Follow the accounting cycle</p></div></div>
          <div class="workflow">
            <template v-for="(step, index) in workflowSteps" :key="step.label">
              <button class="workflow-step" :class="step.tone" type="button" @click="routeTo(step.path)">
                <span class="number">{{ step.number }}</span><feather-icon :name="step.icon" /><b>{{ step.label }}</b><small>{{ step.detail }}</small>
              </button>
              <feather-icon v-if="index < workflowSteps.length - 1" name="arrow-right" class="workflow-arrow" />
            </template>
          </div>
        </section>

        <section class="two-col middle">
          <article class="card panel">
            <div class="panel-title"><h2><feather-icon name="file-text" />Recent Transactions</h2><button type="button" @click="routeTo('/list/SalesInvoice')">View All</button></div>
            <div class="table-head tx-cols"><span>Date</span><span>Description</span><span>Amount</span></div>
            <button v-for="row in recentTransactions" :key="row.id" class="table-row tx-cols" type="button" @click="row.path ? routeTo(row.path) : undefined">
              <span>{{ row.date }}</span><span>{{ row.description }}</span><strong :class="row.negative ? 'negative' : 'positive'">{{ money(row.amount) }}</strong>
            </button>
          </article>
          <article class="card panel cashflow">
            <div class="panel-title"><h2><feather-icon name="clipboard" />Bills &amp; Expenses Cashflow</h2><select aria-label="Cashflow period"><option>Last 6 Months</option><option>This Year</option></select></div>
            <div class="legend"><span><i class="bill"></i>Bills</span><span><i class="expense"></i>Expenses</span><span><i class="cash"></i>Cashflow</span></div>
            <div class="chart"><div class="axis"><span>$12,000</span><span>$9,000</span><span>$6,000</span><span>$3,000</span><span>$0</span></div><div class="chart-area"><div class="grid"><i></i><i></i><i></i><i></i><i></i></div><div v-for="bar in cashFlowBars" :key="bar.label" class="month"><div><i class="bill" :style="{ height: `${bar.bill}%` }"></i><i class="expense" :style="{ height: `${bar.expense}%` }"></i></div><span>{{ bar.label }}</span></div><div class="line"><i v-for="(bar, index) in cashFlowBars" :key="index" :style="{ left: `${8 + index * 17}%`, bottom: `${bar.line}%` }"></i></div></div></div>
          </article>
        </section>

        <section class="two-col bottom">
          <article class="card panel list">
            <div class="panel-title"><h2><feather-icon name="file-text" />Financial Reports</h2><button type="button" @click="routeTo('/report/ProfitAndLoss')">View All</button></div>
            <div class="table-head report-cols"><span>Date</span><span>Description</span><span>Amount</span></div>
            <div v-for="row in financialRows" :key="row.date + row.description" class="table-row report-cols"><span>{{ row.date }}</span><span>{{ row.description }}</span><strong :class="row.negative ? 'negative' : 'positive'">{{ money(row.amount) }}</strong></div>
          </article>
          <article class="card panel list">
            <div class="panel-title"><h2><feather-icon name="calendar" />Upcoming Tasks</h2><button type="button">View All</button></div>
            <div class="table-head task-cols"><span>Task</span><span>Due Date</span></div>
            <div v-for="task in tasks" :key="task.task" class="table-row task-cols"><span>{{ task.task }}</span><span>{{ task.date }}</span></div>
          </article>
        </section>
      </main>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { fyo } from 'src/initFyo';
import DashboardAccountMenu from 'src/components/DashboardAccountMenu.vue';
import { docsPathRef } from 'src/utils/refs';
import { routeTo } from 'src/utils/ui';

type Row = { id: string; date: string; description: string; amount: number; negative?: boolean; path?: string };
type Bar = { label: string; bill: number; expense: number; line: number };
type KpiCard = { label: string; value: number; change: string; changeClass: string; icon: string; tone: string; spark: number[] };

export default defineComponent({
  name: 'Dashboard',
  components: { DashboardAccountMenu },
  data() {
    return {
      accountMenuOpen: false,
      searchQuery: '',
      companyName: 'ContraBooks',
      income: 12480,
      expenses: 8230,
      bankBalance: 18750,
      outstandingInvoices: 6420,
      openBills: 4180,
      recentTransactions: [
        { id: '1', date: '2025-09-14', description: 'Invoice #1008 - ABC Corp', amount: 1250 },
        { id: '2', date: '2025-09-13', description: 'Payment - ABC Corp', amount: 1250 },
        { id: '3', date: '2025-09-12', description: 'Bill - Office Supplies', amount: 320, negative: true },
        { id: '4', date: '2025-09-11', description: 'Invoice #1007 - Maple Services', amount: 890 },
        { id: '5', date: '2025-09-10', description: 'Payment - Maple Services', amount: 890 },
      ] as Row[],
      cashFlowBars: [
        { label: 'Apr', bill: 55, expense: 46, line: 37 }, { label: 'May', bill: 51, expense: 55, line: 43 }, { label: 'Jun', bill: 62, expense: 64, line: 42 }, { label: 'Jul', bill: 69, expense: 73, line: 50 }, { label: 'Aug', bill: 91, expense: 84, line: 50 }, { label: 'Sep', bill: 100, expense: 82, line: 55 },
      ] as Bar[],
      financialRows: [
        { date: 'Sep 18, 2025', description: 'Customer Payment', amount: 1250 }, { date: 'Sep 14, 2025', description: 'Bill Payment', amount: 845.2, negative: true }, { date: 'Sep 13, 2025', description: 'Invoice #1043', amount: 2360 }, { date: 'Sep 12, 2025', description: 'Office Supplies', amount: 189.56, negative: true }, { date: 'Sep 11, 2025', description: 'Customer Payment', amount: 890 },
      ],
      tasks: [
        { task: 'Send invoice to ABC Corp', date: '2025-09-16' }, { task: 'Pay Office Supplies bill', date: '2025-09-17' }, { task: 'Reconcile Bank Account', date: '2025-09-18' }, { task: 'Prepare monthly reports', date: '2025-09-20' }, { task: 'Follow up with Maple Services', date: '2025-09-22' },
      ],
      workflowSteps: [
        { number: 1, label: 'Customers & Sales', detail: 'Create invoices · Receive payments', icon: 'users', tone: 'blue', path: '/list/SalesInvoice' }, { number: 2, label: 'Receive Payments', detail: 'Apply payments · Track receivables', icon: 'credit-card', tone: 'teal', path: '/list/Payment' }, { number: 3, label: 'Vendors & Bills', detail: 'Enter bills · Pay vendors and manage purchases', icon: 'file-text', tone: 'purple', path: '/list/PurchaseInvoice' }, { number: 4, label: 'Banking', detail: 'Reconcile accounts · Manage transactions', icon: 'home', tone: 'blue', path: '/list/BankReconciliation' }, { number: 5, label: 'Accounting', detail: 'Journal entries · Adjustments', icon: 'book-open', tone: 'orange', path: '/list/JournalEntry' }, { number: 6, label: 'Reports', detail: 'Financial statements · Business insights', icon: 'bar-chart-2', tone: 'teal', path: '/report/ProfitAndLoss' },
      ],
    };
  },
  computed: {
    searchPlaceholder(): string {
      const path = this.$route.path.toLowerCase();
      if (path.includes('customer')) return 'Search customers';
      if (path.includes('vendor') || path.includes('purchase')) return 'Search vendors, bills, or purchases';
      if (path.includes('salesinvoice') || path.includes('invoice')) return 'Search invoices, customers, or sales';
      if (path.includes('bank') || path.includes('payment') || path.includes('deposit')) return 'Search accounts, transactions, or deposits';
      if (path.includes('report')) return 'Search reports';
      if (path.includes('employee')) return 'Search employees';
      if (path.includes('inventory') || path.includes('item')) return 'Search items or inventory';
      return 'Search customers, vendors, transactions, or reports';
    },
    initials(): string {
      return this.companyName.split(/\s+/).filter(Boolean).slice(0, 2).map((value) => value[0]).join('').toUpperCase() || 'C';
    },
    kpiCards(): KpiCard[] {
      return [
        { label: 'Total Income', value: this.income, change: '↑ 12%', changeClass: 'positive', icon: 'dollar-sign', tone: 'income', spark: [30,37,26,42,36,52,44,58,50,66,58,76] },
        { label: 'Total Expenses', value: this.expenses, change: '↓ 5%', changeClass: 'positive', icon: 'credit-card', tone: 'expense', spark: [31,46,35,51,39,55,47,61,53,68,58,74] },
        { label: 'Bank Balance', value: this.bankBalance, change: '↑ 8%', changeClass: 'positive', icon: 'home', tone: 'bank', spark: [25,34,29,44,37,53,45,59,50,67,60,78] },
        { label: 'Outstanding Invoices', value: this.outstandingInvoices, change: '↓ 14%', changeClass: 'positive', icon: 'file-text', tone: 'invoice', spark: [27,38,31,45,36,52,43,58,50,65,56,73] },
        { label: 'Open Bills', value: this.openBills, change: '↓ 6%', changeClass: 'orange-text', icon: 'file-text', tone: 'bills', spark: [25,32,28,39,33,48,42,55,49,60,54,70] },
      ];
    },
  },
  activated() { docsPathRef.value = 'books/dashboard'; this.loadCompanyName(); },
  deactivated() { docsPathRef.value = ''; },
  methods: {
    routeTo,
    async loadCompanyName() {
      try {
        const settings = fyo.singles?.AccountingSettings;
        const name = settings?.companyName;
        if (typeof name === 'string' && name.trim()) this.companyName = name.trim();
      } catch { /* dashboard remains usable while company settings initialize */ }
    },
    handleSearchKeydown(event: KeyboardEvent) {
      if (event.key === 'Enter' && this.searchQuery.trim()) {
        const query = this.searchQuery.trim();
        const path = this.$route.path.toLowerCase();
        if (path.includes('customer')) this.routeTo(`/list/Customer?search=${encodeURIComponent(query)}`);
        else if (path.includes('vendor') || path.includes('purchase')) this.routeTo(`/list/PurchaseInvoice?search=${encodeURIComponent(query)}`);
        else if (path.includes('report')) this.routeTo(`/report/ProfitAndLoss?search=${encodeURIComponent(query)}`);
        else this.routeTo(`/list/SalesInvoice?search=${encodeURIComponent(query)}`);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        const input = event.currentTarget as HTMLInputElement;
        input.focus();
        input.select();
      }
    },
    money(value: number) { return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(Number(value || 0)); },
  },
});
</script>

<style scoped>
.dashboard-page{display:flex;flex-direction:column;background:#F5F9FC;color:#07345C;overflow:hidden}
.dashboard-topbar{height:50px;flex:0 0 50px;display:flex;align-items:center;gap:14px;padding:0 14px 0 20px;background:#fff;border-bottom:1px solid #DCE7EF}.dashboard-search{height:36px;flex:1 1 420px;min-width:240px;max-width:560px;display:flex;align-items:center;gap:9px;padding:0 12px;border:1px solid #CDE7EF;border-radius:9px;background:#F8FCFE;color:#0072CE;box-sizing:border-box}.dashboard-search:focus-within{border-color:#00AFC1;box-shadow:0 0 0 2px rgba(0,175,193,.12)}.dashboard-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#14202B;font-size:12px}.dashboard-search input::placeholder{color:#7B9AB4}.dashboard-search span{font-size:10px;color:#7B9AB4;border:1px solid #DCE7EF;border-radius:5px;padding:3px 6px;background:#fff;white-space:nowrap}.title-greeting{min-width:0;display:flex;flex-direction:column;justify-content:center;gap:1px;margin-right:auto}.title-greeting strong{font-size:14px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.title-greeting span{font-size:10px;color:#527391;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.top-actions{display:flex;align-items:center;gap:5px}.top-icon,.account-button{position:relative;width:34px;height:34px;display:grid;place-items:center;border:0;border-radius:7px;background:transparent;color:#075A9B;cursor:pointer}.top-icon svg,.account-button svg{width:18px!important;height:18px!important}.top-icon i{position:absolute;top:0;right:0;min-width:15px;height:15px;border-radius:9px;background:#E5484D;color:#fff;font-size:8px;font-style:normal;display:grid;place-items:center}.divider{height:28px;width:1px;background:#DCE7EF;margin:0 6px}.avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#07345C;color:#fff;font-size:11px;font-weight:700}.user-copy{display:flex;flex-direction:column;gap:1px;min-width:135px}.user-copy b{font-size:11px}.user-copy small{font-size:8px;color:#527391;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.account-wrap{position:relative}
.dashboard-scroll{min-height:0;flex:1;overflow:hidden}.dashboard-content{height:100%;box-sizing:border-box;padding:10px 20px 12px;display:grid;grid-template-rows:164px 187px minmax(205px,1fr) 192px;gap:10px;overflow:hidden}.kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.card{border:1px solid #DCE7EF;border-radius:9px;background:#fff;box-sizing:border-box;box-shadow:0 2px 9px rgba(7,52,92,.04)}.kpi{height:100%;display:flex;gap:12px;padding:12px 13px;overflow:hidden}.kpi-icon{width:41px;height:41px;flex:0 0 41px;display:grid;place-items:center;border-radius:50%;color:#fff}.kpi-icon svg{width:19px!important;height:19px!important}.income .kpi-icon{background:#10A874}.expense .kpi-icon{background:#E5484D}.bank .kpi-icon{background:#1689D5}.invoice .kpi-icon{background:#635BDB}.bills .kpi-icon{background:#F59E0B}.kpi-copy{min-width:0;display:flex;flex-direction:column;flex:1}.kpi-copy>b{font-size:12px;white-space:nowrap}.kpi-copy>strong{margin-top:8px;font-size:20px;line-height:1;white-space:nowrap}.kpi-copy>small{margin-top:8px;font-size:10px;font-weight:700}.kpi-copy small em{font-style:normal;color:#527391;font-weight:400}.positive{color:#10A874}.orange-text{color:#F59E0B}.spark{height:30px;display:flex;align-items:flex-end;gap:3px;margin-top:auto;padding-top:5px}.spark i{flex:1;min-width:3px;border-radius:3px 3px 0 0;background:#10A874}.expense .spark i{background:#E5484D}.bank .spark i{background:#1689D5}.invoice .spark i{background:#635BDB}.bills .spark i{background:#F59E0B}
.workflow-card{padding:12px 16px}.workflow-title{height:40px;display:flex;align-items:center;gap:10px}.workflow-title>svg{width:31px!important;height:31px!important;color:#00AFC1}.workflow-title h2{margin:0;font-size:16px}.workflow-title p{margin:3px 0 0;font-size:10px;color:#527391}.workflow{height:116px;display:grid;grid-template-columns:minmax(0,1fr) 20px minmax(0,1fr) 20px minmax(0,1fr) 20px minmax(0,1fr) 20px minmax(0,1fr) 20px minmax(0,1fr);align-items:center}.workflow-step{height:116px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 12px;border:1px solid #1689D5;border-radius:9px;background:#F5FBFE;color:#07345C;cursor:pointer}.workflow-step>svg{width:28px!important;height:28px!important;margin-bottom:7px;color:#1689D5}.workflow-step .number{position:absolute;top:9px;left:9px;width:27px;height:27px;display:grid;place-items:center;border-radius:50%;background:#1689D5;color:#fff;font-size:11px;font-weight:700}.workflow-step b{font-size:12px;text-align:center}.workflow-step small{margin-top:6px;font-size:9px;line-height:1.35;color:#37709B;text-align:center;max-width:180px}.workflow-step.teal{border-color:#00AFC1;background:#F1FCFB}.workflow-step.teal>svg{color:#00AFC1}.workflow-step.teal .number{background:#00AFC1}.workflow-step.purple{border-color:#635BDB;background:#F8F5FF}.workflow-step.purple>svg{color:#635BDB}.workflow-step.purple .number{background:#635BDB}.workflow-step.orange{border-color:#F59E0B;background:#FFFAEF}.workflow-step.orange>svg{color:#F59E0B}.workflow-step.orange .number{background:#F59E0B}.workflow-arrow{width:16px!important;height:16px!important;color:#1689D5;justify-self:center}
.two-col{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;min-height:0}.panel{padding:11px 12px 8px;min-width:0;min-height:0;overflow:hidden}.panel-title{height:32px;display:flex;align-items:center;justify-content:space-between;gap:10px}.panel-title h2{margin:0;display:flex;align-items:center;gap:9px;font-size:14px}.panel-title h2 svg{width:19px!important;height:19px!important}.panel-title button{border:0;background:transparent;color:#0072CE;font-size:9px;cursor:pointer}.panel-title select{height:28px;padding:0 9px;border:1px solid #CDE7EF;border-radius:6px;background:#fff;color:#07345C;font-size:9px}.table-head{display:grid;align-items:center;height:27px;border-bottom:1px solid #DCE7EF;color:#527391;font-size:9px}.table-row{display:grid;align-items:center;height:27px;border:0;border-bottom:1px solid #EAF0F5;background:#fff;color:#315D7D;text-align:left;font-size:9px}.table-row:hover{background:#F5FAFC}.tx-cols{grid-template-columns:105px 1fr 75px}.report-cols{grid-template-columns:145px 1fr 75px}.task-cols{grid-template-columns:1fr 145px}.table-row strong{text-align:right}.negative{color:#E5484D;font-weight:700}.cashflow{padding-bottom:10px}.legend{height:25px;display:flex;justify-content:flex-end;align-items:center;gap:17px;color:#527391;font-size:9px}.legend span{display:flex;align-items:center;gap:5px}.legend i{width:8px;height:8px;border-radius:50%;display:inline-block}.legend .bill{background:#1689D5}.legend .expense{background:#10A874}.legend .cash{background:#07345C}.chart{height:calc(100% - 57px);min-height:125px;display:flex}.axis{width:50px;display:flex;flex-direction:column;justify-content:space-between;padding:5px 6px 20px 0;color:#527391;font-size:9px;text-align:right}.chart-area{position:relative;flex:1;border-left:1px solid #DCE7EF;border-bottom:1px solid #DCE7EF;display:flex}.grid{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between}.grid i{border-top:1px solid #EAF0F5}.month{position:relative;z-index:2;width:16.666%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end}.month>div{height:78%;display:flex;align-items:flex-end;gap:4px}.month>div i{width:18px;border-radius:3px 3px 0 0}.month .bill{background:#1689D5}.month .expense{background:#10A874}.month>span{margin-top:6px;font-size:9px;color:#527391}.line{position:absolute;inset:0;z-index:3;pointer-events:none}.line:before{content:"";position:absolute;left:8%;right:7%;bottom:50%;height:2px;background:#07345C;transform:rotate(2deg)}.line i{position:absolute;width:7px;height:7px;border-radius:50%;background:#07345C;border:2px solid #fff;transform:translate(-50%,50%)}.bottom .panel{padding-top:10px}.bottom .table-row{height:27px}
:global(html.dark) .dashboard-page{background:#031B2A;color:#EAF7FF}:global(html.dark) .dashboard-topbar{background:#031B2A;border-color:#173B57}:global(html.dark) .dashboard-search{background:#08263B;border-color:#1B4968;color:#BFE8F7}:global(html.dark) .dashboard-search input{color:#F2FAFF}:global(html.dark) .dashboard-search input::placeholder{color:#789DB1}:global(html.dark) .dashboard-search span{background:#0D344B;border-color:#28536C;color:#9FC5D8}:global(html.dark) .top-icon,:global(html.dark) .account-button{color:#BFE8F7}:global(html.dark) .divider{background:#173B57}:global(html.dark) .title-greeting strong,:global(html.dark) .user-copy b,:global(html.dark) .kpi-copy>b,:global(html.dark) .kpi-copy>strong,:global(html.dark) .workflow-title h2,:global(html.dark) .panel-title h2{color:#F2FAFF}:global(html.dark) .title-greeting span,:global(html.dark) .user-copy small,:global(html.dark) .workflow-title p,:global(html.dark) .workflow-step small,:global(html.dark) .table-head,:global(html.dark) .table-row,:global(html.dark) .legend,:global(html.dark) .axis,:global(html.dark) .month>span{color:#9FC5D8}:global(html.dark) .card{background:#08263B;border-color:#1B4968;box-shadow:0 4px 14px rgba(0,0,0,.2)}:global(html.dark) .workflow-step{background:#0A3047;color:#F2FAFF}:global(html.dark) .workflow-step.teal{background:#083A42}:global(html.dark) .workflow-step.purple{background:#211D46}:global(html.dark) .workflow-step.orange{background:#3C3015}:global(html.dark) .table-row{background:#08263B;border-color:#173B57}:global(html.dark) .table-row:hover{background:#0D344C}:global(html.dark) .panel-title select{background:#0B2D45;border-color:#28536C;color:#EAF7FF}:global(html.dark) .grid i{border-color:#173B57}:global(html.dark) .chart-area{border-color:#28536C}:global(html.dark) .line:before{background:#DDF3FC}:global(html.dark) .line i{background:#DDF3FC;border-color:#08263B}:global(html.dark) .legend .cash{background:#DDF3FC}
@media(max-height:850px){.dashboard-content{grid-template-rows:150px 171px minmax(185px,1fr) 170px;gap:8px;padding:8px 16px 9px}.kpi{padding:10px}.kpi-copy>strong{font-size:18px}.workflow-card{padding:10px 12px}.workflow,.workflow-step{height:105px}.workflow-step small{font-size:8px}.panel{padding:9px}.table-row,.table-head{height:25px}.bottom .table-row{height:25px}}
@media(max-width:1150px){.user-copy{min-width:100px}.kpis{gap:8px}.kpi{gap:8px}.kpi-copy>b{font-size:10px}.kpi-copy>strong{font-size:17px}.workflow{grid-template-columns:repeat(3,minmax(0,1fr));height:auto;gap:7px}.workflow-arrow{display:none}.workflow-step{height:52px;display:grid;grid-template-columns:25px 24px 1fr;grid-template-rows:1fr 1fr;gap:0 6px;padding:5px 7px;text-align:left}.workflow-step .number{position:static;grid-row:1 / 3}.workflow-step>svg{width:19px!important;height:19px!important;margin:0;grid-row:1 / 3}.workflow-step b,.workflow-step small{text-align:left;max-width:none;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.workflow-step b{align-self:end}.workflow-step small{align-self:start;margin-top:2px}.workflow-title{height:33px}.dashboard-search{flex-basis:320px;max-width:430px}}
@media(max-width:850px){.dashboard-content{height:auto;min-height:100%;grid-template-rows:auto auto auto auto;overflow:auto}.dashboard-scroll{overflow:auto}.kpis,.middle,.bottom{grid-template-columns:1fr 1fr}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.user-copy{display:none}.workflow{grid-template-columns:1fr 1fr}.dashboard-search{flex-basis:220px;min-width:150px;max-width:none}.title-greeting strong{font-size:12px}.title-greeting span{font-size:9px}}
</style>
