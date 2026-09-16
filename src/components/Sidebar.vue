<template>
  <aside
    class="relative flex h-full min-h-0 w-full flex-col overflow-hidden text-white"
    :class="{ 'window-drag': platform !== 'Windows' }"
  >
    <div class="sidebar-body flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        class="window-no-drag shrink-0 px-5 pb-4 pt-5"
        :class="platform === 'Mac' && languageDirection === 'ltr' ? 'pt-10' : ''"
      >
        <img
          :src="logoUrl"
          alt="ContraBooks — Smarter Accounting. Bigger Possibilities."
          class="block h-auto w-[210px] max-w-full select-none"
          draggable="false"
        />
      </div>

      <nav class="window-no-drag min-h-0 flex-1 overflow-y-auto px-3 pb-4 no-scrollbar">
        <button
          v-for="item in navigation"
          :key="item.label"
          class="sidebar-item flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium"
          :class="isActive(item.route) ? 'sidebar-active' : 'sidebar-inactive'"
          type="button"
          @click="routeTo(item.route)"
        >
          <feather-icon :name="item.icon" class="h-[18px] w-[18px] flex-shrink-0" />
          <span class="truncate">{{ item.label }}</span>
        </button>

        <div class="sidebar-divider mx-2 my-4"></div>
        <div class="px-3 pb-2 text-xs font-semibold text-[#9FC3DB]">{{ t`Quick Links` }}</div>

        <button
          v-for="item in quickLinks"
          :key="item.label"
          class="sidebar-item flex h-9.5 w-full items-center gap-3 rounded-lg px-3 text-left text-sm"
          :class="isActive(item.route) ? 'sidebar-active' : 'sidebar-inactive'"
          type="button"
          @click="routeTo(item.route)"
        >
          <feather-icon :name="item.icon" class="h-4 w-4 flex-shrink-0" />
          <span class="truncate">{{ item.label }}</span>
        </button>

        <button
          class="sidebar-item mt-1 flex h-9.5 w-full items-center gap-3 rounded-lg px-3 text-left text-sm"
          :class="$route.path === '/backup-wizard' ? 'sidebar-active' : 'sidebar-inactive'"
          type="button"
          @click="routeTo('/backup-wizard')"
        >
          <feather-icon name="shield" class="h-4 w-4 flex-shrink-0" />
          <span class="truncate">{{ t`Backup & Export` }}</span>
        </button>
      </nav>
    </div>

    <div class="sidebar-footer window-no-drag shrink-0 px-5 pb-5 pt-3">
      <div class="flex items-center gap-2">
        <img :src="logoUrl" alt="" class="h-auto w-[120px] opacity-90" draggable="false" />
      </div>
      <div class="mt-2 text-[10px] font-medium text-[#8EAFC7]">ContraBooks Desktop Pro</div>
      <div class="mt-0.5 text-[10px] text-[#6F91AB]">v2026.9.1</div>
    </div>

    <button
      class="absolute bottom-3 end-2 rounded-md p-1 text-slate-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-white focus:opacity-100"
      aria-label="Collapse sidebar"
      type="button"
      @click="() => toggleSidebar()"
    >
      <feather-icon name="chevrons-left" class="h-4 w-4" />
    </button>
  </aside>
</template>

<script lang="ts">
import logoUrl from 'src/assets/img/contrabooks-logo.svg';
import { languageDirectionKey, shortcutsKey } from 'src/utils/injectionKeys';
import { routeTo, toggleSidebar } from 'src/utils/ui';
import { defineComponent, inject } from 'vue';
import router from '../router';

const COMPONENT_NAME = 'Sidebar';

type SidebarLink = { label: string; icon: string; route: string };

export default defineComponent({
  name: 'Sidebar',
  props: { darkMode: { type: Boolean, default: false } },
  emits: ['change-db-file', 'toggle-darkmode'],
  setup() {
    return {
      logoUrl,
      languageDirection: inject(languageDirectionKey),
      shortcuts: inject(shortcutsKey),
    };
  },
  data() {
    return {
      navigation: [
        { label: t`Dashboard`, icon: 'home', route: '/' },
        { label: t`Banking`, icon: 'home', route: '/list/Account' },
        { label: t`Sales`, icon: 'shopping-cart', route: '/list/SalesInvoice' },
        { label: t`Customers`, icon: 'users', route: '/list/Party/Customers' },
        { label: t`Vendors`, icon: 'truck', route: '/list/Party/Suppliers' },
        { label: t`Employees`, icon: 'user', route: '/list/Party/Employees' },
        { label: t`Transactions`, icon: 'credit-card', route: '/list/Payment' },
        { label: t`Reports`, icon: 'bar-chart-2', route: '/report/ProfitAndLoss' },
        { label: t`Accounting`, icon: 'book-open', route: '/list/JournalEntry' },
        { label: t`Projects`, icon: 'briefcase', route: '/settings' },
        { label: t`Inventory`, icon: 'package', route: '/list/StockMovement' },
        { label: t`Taxes`, icon: 'percent', route: '/list/Tax' },
        { label: t`Apps`, icon: 'grid', route: '/settings' },
      ] as SidebarLink[],
      quickLinks: [
        { label: t`Create Invoice`, icon: 'file-plus', route: '/edit/SalesInvoice/New Sales Invoice' },
        { label: t`Receive Payment`, icon: 'credit-card', route: '/list/Payment' },
        { label: t`Make Deposit`, icon: 'download', route: '/list/Payment' },
        { label: t`Write Check`, icon: 'edit-3', route: '/list/Payment' },
        { label: t`Reconcile`, icon: 'refresh-cw', route: '/list/BankReconciliation' },
        { label: t`Journal Entry`, icon: 'book-open', route: '/list/JournalEntry' },
      ] as SidebarLink[],
    };
  },
  mounted() {
    this.shortcuts?.shift.set(COMPONENT_NAME, ['KeyH'], () => {
      if (document.body === document.activeElement) this.toggleSidebar();
    });
    this.shortcuts?.set(COMPONENT_NAME, ['F1'], () => this.openDocumentation());
  },
  unmounted() {
    this.shortcuts?.delete(COMPONENT_NAME);
  },
  methods: {
    routeTo,
    toggleSidebar,
    isActive(route: string) {
      const current = this.$route.path;
      if (route === '/') return current === '/';
      return current === route || current.startsWith(`${route}/`);
    },
    openDocumentation() {
      ipc.openLink('https://github.com/dicarlop/ContraBooks');
    },
  },
});
</script>

<style scoped>
.sidebar-body,
.sidebar-footer {
  background: linear-gradient(180deg, #07345C 0%, #062B4A 100%);
}
.sidebar-body {
  background-color: #07345C;
}
.sidebar-item {
  transition: background-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
}
.sidebar-active {
  background: linear-gradient(90deg, #00AFC1 0%, #007FA9 100%);
  color: #FFFFFF;
  box-shadow: 0 7px 18px rgba(0, 0, 0, 0.18);
}
.sidebar-inactive {
  color: #E1EEF7;
}
.sidebar-inactive:hover {
  background: rgba(24, 198, 211, 0.12);
  color: #FFFFFF;
}
.sidebar-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
}
.sidebar-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
