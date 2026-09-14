<template>
  <div
    class="relative flex h-full min-h-0 flex-col overflow-hidden text-white"
    style="background-color: #0F2D5B"
    :class="{ 'window-drag': platform !== 'Windows' }"
  >
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden" style="background-color: #0F2D5B">
      <div class="window-no-drag shrink-0 px-5 pb-5 pt-5" :class="platform === 'Mac' && languageDirection === 'ltr' ? 'pt-10' : ''">
        <img
          :src="logoUrl"
          alt="ContraBooks — Simple. Powerful. Yours."
          class="block h-auto w-[210px] max-w-full select-none"
          draggable="false"
        />
        <div data-testid="company-name" class="mt-4 truncate text-xs font-medium uppercase tracking-[0.16em] text-slate-300">
          {{ companyName }}
        </div>
      </div>

      <nav class="window-no-drag min-h-0 flex-1 overflow-y-auto px-3 pb-4 no-scrollbar" style="background-color: #0F2D5B">
        <div v-for="group in groups" :key="group.name || group.label" class="mb-1.5">
          <button
            class="sidebar-item flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium"
            :class="isGroupActive(group) && !group.items ? 'sidebar-active' : 'sidebar-inactive'"
            @click="routeToSidebarItem(group)"
          >
            <Icon
              class="flex-shrink-0"
              :name="group.icon"
              :size="group.iconSize || '18'"
              :height="group.iconHeight ?? 0"
              :active="!!isGroupActive(group)"
              :darkMode="true"
            />
            <span class="flex-1 truncate">{{ group.label }}</span>
            <feather-icon
              v-if="group.items"
              :name="isGroupActive(group) ? 'chevron-up' : 'chevron-down'"
              class="h-4 w-4 flex-shrink-0 opacity-70"
            />
          </button>

          <div v-if="group.items && isGroupActive(group)" class="mt-1 space-y-0.5 ps-3">
            <button
              v-for="item in group.items"
              :key="item.name || item.label"
              class="sidebar-subitem flex h-8.5 w-full items-center rounded-lg px-3 text-left text-sm font-medium"
              :class="isItemActive(item) ? 'sidebar-active' : 'sidebar-subinactive'"
              @click="routeToSidebarItem(item)"
            >
              <span class="truncate">{{ item.label }}</span>
            </button>

            <template v-if="group.name === 'settings'">
              <button class="sidebar-subitem flex h-8.5 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium" @click="openDocumentation">
                <feather-icon name="help-circle" class="h-4 w-4 flex-shrink-0" />
                <span>{{ t`Help & Support` }}</span>
              </button>
              <button data-testid="change-db" class="sidebar-subitem flex h-8.5 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium" @click="$emit('change-db-file')">
                <feather-icon name="database" class="h-4 w-4 flex-shrink-0" />
                <span>{{ t`Change Database` }}</span>
              </button>
              <button class="sidebar-subitem flex h-8.5 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium" @click="() => reportIssue()">
                <feather-icon name="flag" class="h-4 w-4 flex-shrink-0" />
                <span>{{ t`Report Issue` }}</span>
              </button>
            </template>
          </div>
        </div>
      </nav>
    </div>

    <div class="window-no-drag shrink-0 px-4 pb-4 pt-3" style="background-color: #0F2D5B">
      <div class="flex items-center justify-center px-2 pt-1 text-[11px] font-medium" style="background-color: #0F2D5B">
        <span class="text-white">ContraBooks</span>
        <span class="mx-1 text-[#10B981]">·</span>
        <span class="text-[#10B981]">v1.0.0</span>
      </div>
    </div>

    <button class="absolute bottom-3 end-3 rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" @click="() => toggleSidebar()">
      <feather-icon name="chevrons-left" class="h-4 w-4" />
    </button>
  </div>
</template>
<script lang="ts">
import logoUrl from 'src/assets/img/contrabooks-logo.svg';
import { reportIssue } from 'src/errorHandling';
import { fyo } from 'src/initFyo';
import { languageDirectionKey, shortcutsKey } from 'src/utils/injectionKeys';
import { getSidebarConfig } from 'src/utils/sidebarConfig';
import { SidebarConfig, SidebarItem, SidebarRoot } from 'src/utils/types';
import { routeTo, toggleSidebar } from 'src/utils/ui';
import { defineComponent, inject } from 'vue';
import router from '../router';
import Icon from './Icon.vue';

const COMPONENT_NAME = 'Sidebar';

export default defineComponent({
  components: { Icon },
  props: { darkMode: { type: Boolean, default: false } },
  emits: ['change-db-file', 'toggle-darkmode'],
  setup() { return { logoUrl, languageDirection: inject(languageDirectionKey), shortcuts: inject(shortcutsKey) }; },
  data() {
    return { companyName: '', groups: [], activeGroup: null, showDevMode: false } as {
      companyName: string; groups: SidebarConfig; activeGroup: null | SidebarRoot; showDevMode: boolean;
    };
  },
  async mounted() {
    const { companyName } = await fyo.doc.getDoc('AccountingSettings');
    this.companyName = companyName as string;
    this.groups = await getSidebarConfig();
    this.setActiveGroup();
    router.afterEach(() => this.setActiveGroup());
    this.shortcuts?.shift.set(COMPONENT_NAME, ['KeyH'], () => { if (document.body === document.activeElement) this.toggleSidebar(); });
    this.shortcuts?.set(COMPONENT_NAME, ['F1'], () => this.openDocumentation());
    this.showDevMode = this.fyo.store.isDevelopment;
  },
  unmounted() { this.shortcuts?.delete(COMPONENT_NAME); },
  methods: {
    routeTo, reportIssue, toggleSidebar,
    openDocumentation() { ipc.openLink('https://github.com/dicarlop/ContraBooks'); },
    setActiveGroup() {
      const { fullPath } = this.$router.currentRoute.value;
      const fallBackGroup = this.activeGroup;
      this.activeGroup = this.groups.find((g) => {
        if (fullPath.startsWith(g.route) && g.route !== '/') return true;
        if (g.route === fullPath) return true;
        if (g.items) return g.items.some(({ route }) => route === fullPath || fullPath.startsWith(route));
        return false;
      }) ?? fallBackGroup ?? this.groups[0];
    },
    isItemActive(item: SidebarItem) {
      const { path: currentRoute, params } = this.$route;
      const routeMatch = currentRoute === item.route;
      const schemaNameMatch = item.schemaName && params.schemaName === item.schemaName;
      const isMatch = routeMatch || schemaNameMatch;
      if (params.name && item.schemaName && !isMatch) return currentRoute.includes(`${item.schemaName}/${params.name}`);
      return isMatch;
    },
    isGroupActive(group: SidebarRoot) { return this.activeGroup && group.name === this.activeGroup.name; },
    routeToSidebarItem(item: SidebarItem | SidebarRoot) { routeTo(this.getPath(item)); },
    getPath(item: SidebarItem | SidebarRoot) {
      const { route: path, filters } = item;
      if (!filters) return path;
      return { path, query: { filters: JSON.stringify(filters) } };
    },
  },
});
</script>
<style scoped>
.sidebar-item,.sidebar-subitem{transition:background-color 140ms ease,color 140ms ease,box-shadow 140ms ease}
.sidebar-active{background:#2563EB;color:#fff;box-shadow:0 6px 16px rgba(37,99,235,.22)}
.sidebar-inactive{color:#D7E5F4}
.sidebar-inactive:hover,.sidebar-subinactive:hover{background:rgba(255,255,255,.09);color:#fff}
.sidebar-subinactive{color:#A9BFD5}
</style>
