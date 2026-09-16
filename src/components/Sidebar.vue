<template>
  <aside class="sidebar-shell relative flex h-full min-h-0 w-full flex-col overflow-hidden text-white" :class="{ 'window-drag': platform !== 'Windows' }">
    <div class="sidebar-brand window-no-drag shrink-0 px-5 pt-5 pb-4">
      <div class="brand-lockup" aria-label="ContraBooks">
        <div class="brand-mark" aria-hidden="true"><span>c</span><span>b</span></div>
        <div class="brand-copy"><strong>contra<span>books</span></strong><small>Smarter Accounting. Bigger Possibilities.</small></div>
      </div>
    </div>

    <nav class="window-no-drag min-h-0 flex-1 overflow-y-auto px-3 pb-4 no-scrollbar" aria-label="Main navigation">
      <button v-for="item in navigation" :key="item.label" class="sidebar-item flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium" :class="isActive(item.route) ? 'sidebar-active' : 'sidebar-inactive'" type="button" @click="routeTo(item.route)">
        <Icon :name="item.icon" size="18" :active="isActive(item.route)" :dark-mode="true" class="shrink-0" />
        <span class="truncate">{{ item.label }}</span>
      </button>

      <div class="sidebar-divider mx-2 my-4"></div>
      <div class="flex items-center justify-between px-3 pb-2">
        <span class="text-xs font-semibold text-[#A9C7DB]">{{ t`Quick Links` }}</span>
        <span class="text-lg leading-none text-[#A9C7DB]">+</span>
      </div>

      <button v-for="item in quickLinks" :key="item.label" class="sidebar-item flex h-9.5 w-full items-center gap-3 rounded-lg px-3 text-left text-sm" :class="isActive(item.route) ? 'sidebar-active' : 'sidebar-inactive'" type="button" @click="routeTo(item.route)">
        <Icon :name="item.icon" size="18" :active="isActive(item.route)" :dark-mode="true" class="shrink-0" />
        <span class="truncate">{{ item.label }}</span>
      </button>

      <button class="sidebar-item flex h-9.5 w-full items-center gap-3 rounded-lg px-3 text-left text-sm" :class="$route.path === '/backup-wizard' ? 'sidebar-active' : 'sidebar-inactive'" type="button" @click="routeTo('/backup-wizard')">
        <Icon name="system" size="18" :active="$route.path === '/backup-wizard'" :dark-mode="true" class="shrink-0" />
        <span class="truncate">{{ t`Backup & Export` }}</span>
      </button>
    </nav>

    <div class="sidebar-footer window-no-drag shrink-0 px-5 pb-5 pt-4">
      <div class="footer-lockup">
        <div class="footer-mark" aria-hidden="true"><span>c</span><span>b</span></div>
        <div><strong>contra<span>books</span></strong><small>Smarter Accounting. Bigger Possibilities.</small></div>
      </div>
      <div class="mt-3 text-[10px] font-medium text-[#8EAFC7]">ContraBooks Desktop Pro</div>
      <div class="mt-0.5 text-[10px] text-[#6F91AB]">v2026.9.1</div>
    </div>

    <button class="absolute bottom-3 end-2 rounded-md p-1 text-slate-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-white focus:opacity-100" aria-label="Collapse sidebar" type="button" @click="() => toggleSidebar()">
      <feather-icon name="chevrons-left" class="h-4 w-4" />
    </button>
  </aside>
</template>

<script lang="ts">
import { t } from 'fyo';
import { languageDirectionKey, shortcutsKey } from 'src/utils/injectionKeys';
import { routeTo, toggleSidebar } from 'src/utils/ui';
import { defineComponent, inject } from 'vue';
import Icon from './Icon.vue';

const COMPONENT_NAME = 'Sidebar';
type SidebarLink = { label: string; icon: string; route: string };

export default defineComponent({
  name: 'Sidebar',
  components: { Icon },
  props: { darkMode: { type: Boolean, default: false } },
  emits: ['change-db-file', 'toggle-darkmode'],
  setup() {
    return { languageDirection: inject(languageDirectionKey), shortcuts: inject(shortcutsKey) };
  },
  data() {
    return {
      navigation: [
        { label: t`Dashboard`, icon: 'dashboard', route: '/' },
        { label: t`Banking`, icon: 'opening-ac', route: '/list/Account' },
        { label: t`Sales`, icon: 'sales', route: '/list/SalesInvoice' },
        { label: t`Customers`, icon: 'customer', route: '/list/Party/Customers' },
        { label: t`Vendors`, icon: 'supplier', route: '/list/Party/Suppliers' },
        { label: t`Employees`, icon: 'general', route: '/list/Party/Employees' },
        { label: t`Transactions`, icon: 'invoice', route: '/list/Payment' },
        { label: t`Reports`, icon: 'reports', route: '/report/ProfitAndLoss' },
        { label: t`Accounting`, icon: 'common-entries', route: '/list/JournalEntry' },
        { label: t`Projects`, icon: 'item', route: '/settings' },
        { label: t`Inventory`, icon: 'inventory', route: '/list/StockMovement' },
        { label: t`Taxes`, icon: 'gst', route: '/list/Tax' },
        { label: t`Apps`, icon: 'system', route: '/settings' },
      ] as SidebarLink[],
      quickLinks: [
        { label: t`Create Invoice`, icon: 'sales-invoice', route: '/list/SalesInvoice' },
        { label: t`Receive Payment`, icon: 'invoice', route: '/list/Payment' },
        { label: t`Make Deposit`, icon: 'opening-ac', route: '/list/Payment' },
        { label: t`Write Check`, icon: 'check', route: '/list/Payment' },
        { label: t`Reconcile`, icon: 'review-ac', route: '/list/BankReconciliation' },
        { label: t`Journal Entry`, icon: 'common-entries', route: '/list/JournalEntry' },
      ] as SidebarLink[],
    };
  },
  mounted() {
    this.shortcuts?.shift.set(COMPONENT_NAME, ['KeyH'], () => {
      if (document.body === document.activeElement) this.toggleSidebar();
    });
    this.shortcuts?.set(COMPONENT_NAME, ['F1'], () => this.openDocumentation());
  },
  unmounted() { this.shortcuts?.delete(COMPONENT_NAME); },
  methods: {
    routeTo,
    toggleSidebar,
    isActive(route: string) {
      const current = this.$route.path;
      if (route === '/') return current === '/';
      return current === route || current.startsWith(`${route}/`);
    },
    openDocumentation() { ipc.openLink('https://github.com/dicarlop/ContraBooks'); },
  },
});
</script>

<style scoped>
.sidebar-shell { background: linear-gradient(180deg, #07345C 0%, #062B4A 100%); }
.sidebar-brand { border-bottom: 1px solid rgba(255,255,255,.08); }
.brand-lockup,.footer-lockup { display:flex; align-items:center; gap:9px; }
.brand-mark,.footer-mark { position:relative; display:flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:11px; background:linear-gradient(135deg,#18C6D3 0%,#0072CE 100%); color:#fff; font-weight:800; font-style:italic; letter-spacing:-8px; padding-right:7px; box-shadow:0 5px 14px rgba(0,0,0,.18); }
.brand-mark span,.footer-mark span { font-size:21px; line-height:1; }
.brand-copy strong,.footer-lockup strong { display:block; color:#fff; font-size:18px; line-height:18px; font-weight:800; letter-spacing:-.7px; font-style:italic; }
.brand-copy strong span,.footer-lockup strong span { color:#18C6D3; }
.brand-copy small,.footer-lockup small { display:block; margin-top:3px; color:#9FC3DB; font-size:7px; line-height:8px; letter-spacing:.05px; white-space:nowrap; }
.sidebar-item { transition:background-color 140ms ease,color 140ms ease,box-shadow 140ms ease; }
.sidebar-active { background:linear-gradient(90deg,#00AFC1 0%,#007FA9 100%); color:#fff; box-shadow:0 6px 16px rgba(0,0,0,.18); }
.sidebar-inactive { color:#E1EEF7; }
.sidebar-inactive:hover { background:rgba(24,198,211,.12); color:#fff; }
.sidebar-divider { height:1px; background:rgba(255,255,255,.12); }
.sidebar-footer { border-top:1px solid rgba(255,255,255,.1); }
.footer-mark { width:28px; height:28px; border-radius:9px; }
.footer-mark span { font-size:17px; }
.footer-lockup strong { font-size:14px; line-height:14px; }
.footer-lockup small { font-size:6px; line-height:7px; }
</style>
