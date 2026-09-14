<template>
  <div
    class="h-full min-h-0 flex flex-col bg-[#062A4F] text-white relative overflow-hidden"
    :class="{ 'window-drag': platform !== 'Windows' }"
  >
    <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar">
      <div
        class="window-no-drag px-5 pt-5 pb-5"
        :class="platform === 'Mac' && languageDirection === 'ltr' ? 'pt-10' : ''"
      >
        <img
          :src="logoUrl"
          alt="ContraBooks"
          class="block w-[220px] max-w-full h-auto select-none"
          draggable="false"
        />
        <div
          data-testid="company-name"
          class="mt-4 truncate text-xs font-medium uppercase tracking-[0.16em] text-slate-300"
        >
          {{ companyName }}
        </div>
      </div>

      <nav class="window-no-drag px-3 space-y-1.5">
        <div v-for="group in groups" :key="group.label">
          <button
            class="sidebar-item w-full h-11 px-3 rounded-xl flex items-center gap-3 text-left text-sm font-medium"
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
            <span class="truncate flex-1">{{ group.label }}</span>
            <feather-icon
              v-if="group.items"
              :name="isGroupActive(group) ? 'chevron-up' : 'chevron-down'"
              class="w-4 h-4 flex-shrink-0 opacity-80"
            />
          </button>

          <div v-if="group.items && isGroupActive(group)" class="mt-1.5 space-y-1 ps-3">
            <button
              v-for="item in group.items"
              :key="item.label"
              class="sidebar-subitem w-full h-9 px-3 rounded-lg flex items-center text-left text-sm"
              :class="isItemActive(item) ? 'sidebar-active' : 'sidebar-subinactive'"
              @click="routeToSidebarItem(item)"
            >
              <span class="truncate">{{ item.label }}</span>
            </button>

            <template v-if="group.name === 'settings'">
              <button
                class="sidebar-subitem w-full h-9 px-3 rounded-lg flex items-center gap-2 text-left text-sm"
                @click="openDocumentation"
              >
                <feather-icon name="help-circle" class="h-4 w-4 flex-shrink-0" />
                <span>{{ t`Help` }}</span>
              </button>
              <button
                data-testid="change-db"
                class="sidebar-subitem w-full h-9 px-3 rounded-lg flex items-center gap-2 text-left text-sm"
                @click="$emit('change-db-file')"
              >
                <feather-icon name="database" class="h-4 w-4 flex-shrink-0" />
                <span>{{ t`Change DB` }}</span>
              </button>
              <button
                class="sidebar-subitem w-full h-9 px-3 rounded-lg flex items-center gap-2 text-left text-sm"
                @click="() => reportIssue()"
              >
                <feather-icon name="flag" class="h-4 w-4 flex-shrink-0" />
                <span>{{ t`Report Issue` }}</span>
              </button>
            </template>
          </div>
        </div>
      </nav>
    </div>

    <div class="window-no-drag shrink-0 px-4 pt-3 pb-4 border-t border-white/10 space-y-1 bg-[#062A4F]">
      <button
        class="sidebar-footer-item w-full h-9 px-2 flex items-center gap-2 rounded-lg text-sm"
        @click="viewShortcuts = true"
      >
        <feather-icon name="command" class="h-4 w-4 flex-shrink-0" />
        <span>{{ t`Shortcuts` }}</span>
      </button>

      <div class="flex items-center justify-between pt-3 px-2 text-[11px] text-slate-400">
        <span>ContraBooks</span>
        <span>v1.0</span>
      </div>
    </div>

    <button
      class="absolute bottom-3 end-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-md p-1"
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
<style scoped>
.sidebar-item,
.sidebar-subitem,
.sidebar-footer-item {
  transition: background-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
}

.sidebar-active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.22);
}

.sidebar-inactive {
  color: #d7e5f4;
}

.sidebar-inactive:hover,
.sidebar-subinactive:hover,
.sidebar-footer-item:hover {
  background: rgba(255, 255, 255, 0.09);
  color: #ffffff;
}

.sidebar-subinactive,
.sidebar-footer-item {
  color: #a9bfd5;
}
</style>
