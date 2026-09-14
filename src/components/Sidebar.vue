<template>
  <div
    class="h-full flex flex-col justify-between bg-[#0F172A] text-white relative overflow-hidden"
    :class="{ 'window-drag': platform !== 'Windows' }"
  >
    <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar">
      <div
        class="window-no-drag px-5 pt-5 pb-4"
        :class="platform === 'Mac' && languageDirection === 'ltr' ? 'pt-10' : ''"
      >
        <img
          :src="logoUrl"
          alt="ContraBooks"
          class="w-full max-w-[210px] h-auto select-none"
          draggable="false"
        />
        <div
          data-testid="company-name"
          class="mt-4 truncate text-xs font-medium uppercase tracking-[0.16em] text-slate-300"
        >
          {{ companyName }}
        </div>
      </div>

      <nav class="window-no-drag px-3 space-y-1">
        <div v-for="group in groups" :key="group.label">
          <button
            class="w-full h-11 px-3 rounded-lg flex items-center gap-3 text-left text-sm font-medium transition-colors"
            :class="
              isGroupActive(group) && !group.items
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            "
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
            <span class="truncate">{{ group.label }}</span>
          </button>

          <div v-if="group.items && isGroupActive(group)" class="mt-1 space-y-1 ps-3">
            <button
              v-for="item in group.items"
              :key="item.label"
              class="w-full h-9 px-3 rounded-md flex items-center text-left text-sm transition-colors"
              :class="
                isItemActive(item)
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              "
              @click="routeToSidebarItem(item)"
            >
              <span class="truncate">{{ item.label }}</span>
            </button>
          </div>
        </div>
      </nav>
    </div>

    <div class="window-no-drag px-4 pt-3 pb-4 border-t border-slate-800 space-y-1">
      <button
        class="w-full h-9 px-2 flex items-center gap-2 rounded-md text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        @click="openDocumentation"
      >
        <feather-icon name="help-circle" class="h-4 w-4 flex-shrink-0" />
        <span>{{ t`Help` }}</span>
      </button>

      <button
        class="w-full h-9 px-2 flex items-center gap-2 rounded-md text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        @click="viewShortcuts = true"
      >
        <feather-icon name="command" class="h-4 w-4 flex-shrink-0" />
        <span>{{ t`Shortcuts` }}</span>
      </button>

      <button
        data-testid="change-db"
        class="w-full h-9 px-2 flex items-center gap-2 rounded-md text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        @click="$emit('change-db-file')"
      >
        <feather-icon name="database" class="h-4 w-4 flex-shrink-0" />
        <span>{{ t`Change DB` }}</span>
      </button>

      <button
        class="w-full h-9 px-2 flex items-center gap-2 rounded-md text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        @click="() => reportIssue()"
      >
        <feather-icon name="flag" class="h-4 w-4 flex-shrink-0" />
        <span>{{ t`Report Issue` }}</span>
      </button>

      <div class="flex items-center justify-between pt-3 px-2 text-[11px] text-slate-500">
        <span>ContraBooks</span>
        <span>v1.0</span>
      </div>

      <p
        v-if="showDevMode"
        class="text-xs text-slate-500 select-none cursor-pointer px-2 pt-1"
        @click="showDevMode = false"
        title="Open dev tools with Ctrl+Shift+I"
      >
        dev mode
      </p>
    </div>

    <button
      class="absolute bottom-3 end-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md p-1"
      @click="() => toggleSidebar()"
    >
      <feather-icon name="chevrons-left" class="w-4 h-4" />
    </button>

    <Modal :open-modal="viewShortcuts" @closemodal="viewShortcuts = false">
      <ShortcutsHelper class="w-form" />
    </Modal>
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
import Modal from './Modal.vue';
import ShortcutsHelper from './ShortcutsHelper.vue';

const COMPONENT_NAME = 'Sidebar';

export default defineComponent({
  components: { Icon, Modal, ShortcutsHelper },
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
      companyName: '',
      groups: [],
      viewShortcuts: false,
      activeGroup: null,
      showDevMode: false,
    } as {
      companyName: string;
      groups: SidebarConfig;
      viewShortcuts: boolean;
      activeGroup: null | SidebarRoot;
      showDevMode: boolean;
    };
  },
  async mounted() {
    const { companyName } = await fyo.doc.getDoc('AccountingSettings');
    this.companyName = companyName as string;
    this.groups = await getSidebarConfig();
    this.setActiveGroup();
    router.afterEach(() => this.setActiveGroup());

    this.shortcuts?.shift.set(COMPONENT_NAME, ['KeyH'], () => {
      if (document.body === document.activeElement) this.toggleSidebar();
    });
    this.shortcuts?.set(COMPONENT_NAME, ['F1'], () => this.openDocumentation());
    this.showDevMode = this.fyo.store.isDevelopment;
  },
  unmounted() {
    this.shortcuts?.delete(COMPONENT_NAME);
  },
  methods: {
    routeTo,
    reportIssue,
    toggleSidebar,
    openDocumentation() {
      ipc.openLink('https://github.com/dicarlop/ContraBooks');
    },
    setActiveGroup() {
      const { fullPath } = this.$router.currentRoute.value;
      const fallBackGroup = this.activeGroup;
      this.activeGroup =
        this.groups.find((g) => {
          if (fullPath.startsWith(g.route) && g.route !== '/') return true;
          if (g.route === fullPath) return true;
          if (g.items) {
            const activeItem = g.items.filter(
              ({ route }) => route === fullPath || fullPath.startsWith(route)
            );
            if (activeItem.length) return true;
          }
        }) ?? fallBackGroup ?? this.groups[0];
    },
    isItemActive(item: SidebarItem) {
      const { path: currentRoute, params } = this.$route;
      const routeMatch = currentRoute === item.route;
      const schemaNameMatch = item.schemaName && params.schemaName === item.schemaName;
      const isMatch = routeMatch || schemaNameMatch;
      if (params.name && item.schemaName && !isMatch) {
        return currentRoute.includes(`${item.schemaName}/${params.name}`);
      }
      return isMatch;
    },
    isGroupActive(group: SidebarRoot) {
      return this.activeGroup && group.label === this.activeGroup.label;
    },
    routeToSidebarItem(item: SidebarItem | SidebarRoot) {
      routeTo(this.getPath(item));
    },
    getPath(item: SidebarItem | SidebarRoot) {
      const { route: path, filters } = item;
      if (!filters) return path;
      return { path, query: { filters: JSON.stringify(filters) } };
    },
  },
});
</script>
