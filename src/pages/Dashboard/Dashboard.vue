<template>
  <div class="dashboard-page h-full min-h-0 min-w-0 w-full bg-[#F8FAFC] text-[#0F172A]">
    <header class="dashboard-topbar">
      <div class="dashboard-search"><feather-icon name="search" class="h-4 w-4 text-[#64748B]"/><input aria-label="Search customers, invoices, or anything" placeholder="Search customers, invoices, or anything..."/><span>Ctrl K</span></div>
      <div class="dashboard-top-actions"><button title="Notifications"><feather-icon name="bell" class="h-4 w-4"/></button><button title="Settings" @click="routeTo('/settings')"><feather-icon name="settings" class="h-4 w-4"/></button><div class="dashboard-avatar">{{ initials }}</div></div>
    </header>
    <div class="dashboard-scroll no-scrollbar">
      <div class="dashboard-shell">
        <main class="dashboard-main">
          <header class="dashboard-welcome">
            <div><h1>Good afternoon, {{ firstName }}</h1><p>Here's what's happening with your business today.</p></div>
            <div class="dashboard-company"><div>{{ formattedDate }}</div><button @click="routeTo('/settings')"><feather-icon name="briefcase" class="h-4 w-4"/><span class="truncate">{{ companyName || 'Company file' }}</span><feather-icon name="chevron-down" class="h-3.5 w-3.5"/></button></div>
          </header>

          <div class="dashboard-kpis">
            <section class="dashboard-card dashboard-kpi blue"><div class="kpi-icon"><feather-icon name="file-text" class="h-5 w-5"/></div><div><b>Outstanding Invoices</b><strong><UnpaidInvoices :schema-name="'SalesInvoice'" :dark-mode="false"/></strong><button @click="routeTo('/list/SalesInvoice')">View invoices →</button></div></section>
            <section class="dashboard-card dashboard-kpi green"><div class="kpi-icon"><feather-icon name="credit-card" class="h-5 w-5"/></div><div><b>Outstanding Bills</b><strong><UnpaidInvoices :schema-name="'PurchaseInvoice'" :dark-mode="false"/></strong><button @click="routeTo('/list/PurchaseInvoice')">View bills →</button></div></section>
          </div>

          <div class="primary-grid">
            <section class="dashboard-card chart-card">
              <div class="section-head"><div><h2>Sales Overview</h2><p>Cash moving through your company file</p></div><div class="range-tabs"><button class="active">This Year</button><button @click="setPeriod('This Quarter')">Quarter</button><button @click="setPeriod('This Month')">Month</button><button @click="setPeriod('YTD')">YTD</button></div></div>
              <Cashflow :common-period="period" :dark-mode="false" @period-change="handlePeriodChange"/>
            </section>
            <section class="dashboard-card list-card">
              <div class="section-head"><div><h2>Recent Invoices</h2><p>Latest activity in your sales ledger</p></div><button class="view-all" @click="routeTo('/list/SalesInvoice')">View all</button></div>
              <div v-if="recentInvoices.length">
                <button v-for="invoice in recentInvoices" :key="invoice.name" class="invoice-row" @click="routeTo(`/edit/SalesInvoice/${invoice.name}`)"><span class="row-icon"><feather-icon name="file-text" class="h-4 w-4"/></span><span class="row-copy"><b>{{ invoice.name }}</b><small>{{ invoice.party || 'Customer' }} · {{ formatDate(invoice.date) }}</small></span><strong>{{ formatCurrency(invoice.grandTotal) }}</strong><em :class="`status-${invoice.status.toLowerCase()}`">{{ invoice.status }}</em></button>
              </div><div v-else class="empty">No sales invoices have been recorded yet.</div>
            </section>
          </div>

          <div class="secondary-grid">
            <section class="dashboard-card list-card"><div class="section-head"><div><h2>Recent Activity</h2><p>Latest invoice events</p></div><button class="view-all" @click="routeTo('/list/SalesInvoice')">View all</button></div><div v-if="recentInvoices.length"><div v-for="invoice in recentInvoices" :key="`a-${invoice.name}`" class="activity-row"><i :class="`activity-dot activity-${invoice.status.toLowerCase()}`"></i><span><b>{{ activityText(invoice) }}</b><small>{{ invoice.party || 'Customer' }} · {{ formatCurrency(invoice.grandTotal) }}</small></span><time>{{ formatDate(invoice.date, true) }}</time></div></div><div v-else class="empty">Activity will appear here as you work.</div></section>
            <section class="dashboard-card list-card"><div class="section-head"><div><h2>Top Customers</h2><p>Sales recorded in the company file</p></div><button class="view-all" @click="routeTo('/list/Party/Customers')">View all</button></div><div v-if="topCustomers.length"><button v-for="(customer,index) in topCustomers" :key="customer.name" class="rank-row" @click="routeTo('/list/Party/Customers')"><span class="rank-avatar">{{ initialsFor(customer.name) }}</span><span><b>{{ customer.name }}</b><small>#{{ index+1 }}</small></span><strong>{{ formatCurrency(customer.total) }}</strong></button></div><div v-else class="empty">Sales by customer will appear here.</div></section>
            <section class="dashboard-card list-card"><div class="section-head"><div><h2>Top Products / Services</h2><p>Items sold on submitted invoices</p></div><button class="view-all" @click="routeTo('/list/Item')">View all</button></div><div v-if="topProducts.length"><div v-for="(product,index) in topProducts" :key="product.name" class="rank-row"><span class="product-icon"><feather-icon name="package" class="h-4 w-4"/></span><span><b>{{ product.name }}</b><small>#{{ index+1 }}</small></span><strong>{{ formatCurrency(product.total) }}</strong></div></div><div v-else class="empty">Product and service sales will appear here.</div></section>
          </div>
        </main>

        <aside class="dashboard-rail">
          <section><div class="section-head"><div><h2>Quick Actions</h2><p>Common tasks, one click away</p></div></div>
            <button class="quick blue" @click="createDocument('SalesInvoice')"><span><feather-icon name="file-plus" class="h-4 w-4"/></span>Create Invoice <b>›</b></button>
            <button class="quick green" @click="createCustomer"><span><feather-icon name="user-plus" class="h-4 w-4"/></span>Add Customer <b>›</b></button>
            <button class="quick teal" @click="createDocument('Payment')"><span><feather-icon name="credit-card" class="h-4 w-4"/></span>Record Payment <b>›</b></button>
            <button class="quick purple" @click="createDocument('PurchaseInvoice')"><span><feather-icon name="file-text" class="h-4 w-4"/></span>Enter Bill <b>›</b></button>
            <button class="quick navy" @click="routeTo('/report/GeneralLedger')"><span><feather-icon name="bar-chart-2" class="h-4 w-4"/></span>View Reports <b>›</b></button>
          </section>
          <section class="tip"><div><feather-icon name="check" class="h-6 w-6"/></div><h3>Keep your books in balance</h3><p>Track income, manage expenses, and grow your business — all in one place.</p><button @click="routeTo('/get-started')">Learn more</button></section>
          <div class="connected"><i></i>Connected to your company file</div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import { fyo } from 'src/initFyo';
import PageHeader from 'src/components/PageHeader.vue';
import UnpaidInvoices from './UnpaidInvoices.vue';
import Cashflow from './Cashflow.vue';
import PeriodSelector from './PeriodSelector.vue';
import { docsPathRef } from 'src/utils/refs';
import { routeTo } from 'src/utils/ui';
import { ModelNameEnum } from 'models/types';
import type { PeriodKey } from 'src/utils/types';

type InvoiceRow={name:string;party:string;date:unknown;grandTotal:unknown;status:string};
type RankRow={name:string;total:number};

export default {
  name:'Dashboard',
  components:{PageHeader,Cashflow,PeriodSelector,UnpaidInvoices},
  props:{darkMode:{type:Boolean,default:false}},
  data(){return{period:'This Year' as PeriodKey,companyName:'',recentInvoices:[] as InvoiceRow[],topCustomers:[] as RankRow[],topProducts:[] as RankRow[]};},
  computed:{
    firstName(){const name=this.$route.query?.name;return typeof name==='string'&&name?name:'there';},
    initials(){return this.initialsFor(this.firstName);},
    formattedDate(){return new Intl.DateTimeFormat(undefined,{month:'long',day:'numeric',year:'numeric'}).format(new Date());},
  },
  async activated(){docsPathRef.value='books/dashboard';await this.loadDashboardData();},