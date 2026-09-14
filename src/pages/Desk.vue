<template>
  <div class="flex h-full min-h-0 min-w-0 overflow-hidden bg-[#F8FAFC]">
    <Transition name="sidebar">
      <!-- eslint-disable vue/require-explicit-emits -->
      <Sidebar
        v-show="showSidebar"
        class="h-full min-h-0 self-stretch flex-shrink-0 whitespace-nowrap bg-[#0F2D5B] w-sidebar"
        :dark-mode="darkMode"
        @change-db-file="$emit('change-db-file')"
      />
    </Transition>

    <div class="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-[#F8FAFC] dark:bg-gray-875">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component
            :is="Component"
            :key="$route.path"
            :dark-mode="darkMode"
            class="min-h-0 min-w-0 flex-1"
          />
        </keep-alive>
      </router-view>

      <router-view v-slot="{ Component, route }" name="edit">
        <Transition name="quickedit">
          <div v-if="route?.query?.edit">
            <component
              :is="Component"
              :key="route.query.schemaName + route.query.name"
              :dark-mode="darkMode"
            />
          </div>
        </Transition>
      </router-view>
    </div>

    <button
      v-show="!showSidebar"
      class="absolute bottom-0 start-0 m-4 rounded p-1 text-gray-600 opacity-0 hover:bg-gray-100 hover:opacity-100 hover:shadow-md dark:text-gray-400 dark:hover:bg-gray-900 rtl-rotate-180"
      @click="() => toggleSidebar()"
    >
      <feather-icon name="chevrons-right" class="h-4 w-4" />
    </button>
  </div>
</template>
<script setup lang="ts">
import { showSidebar } from 'src/utils/refs';
import { toggleSidebar } from 'src/utils/ui';
</script>
<script lang="ts">
import { defineComponent } from 'vue';
import Sidebar from '../components/Sidebar.vue';

export default defineComponent({
  name: 'Desk',
  components: { Sidebar },
  props: { darkMode: { type: Boolean, default: false } },
  emits: ['change-db-file'],
});
</script>
<style scoped>
.sidebar-enter-from,
.sidebar-leave-to { opacity:0; transform:translateX(calc(-1 * var(--w-sidebar))); width:0; }
[dir='rtl'] .sidebar-leave-to { opacity:0; transform:translateX(calc(1 * var(--w-sidebar))); width:0; }
.sidebar-enter-to,
.sidebar-leave-from { opacity:1; transform:translateX(0); width:var(--w-sidebar); }
.sidebar-enter-active,
.sidebar-leave-active { transition:all 150ms ease-out; }

/* Keep the dashboard fluid as the desktop window is resized; do not zoom the entire page. */
:deep(.dashboard-page) {
  zoom: 1;
  overflow: hidden;
}

:deep(.dashboard-page .dashboard-scroll) {
  overflow: auto;
}

:deep(.dashboard-page .dashboard-shell) {
  width: 100%;
  max-width: none;
  min-height: 100%;
  box-sizing: border-box;
  padding: clamp(14px, 1.5vw, 24px) clamp(14px, 1.6vw, 24px) 18px;
  grid-template-columns: minmax(0, 1fr) clamp(210px, 18vw, 238px);
  gap: clamp(12px, 1.2vw, 18px);
}

:deep(.dashboard-page .dashboard-kpis) {
  gap: clamp(8px, 0.8vw, 12px);
}

:deep(.dashboard-page .dashboard-kpi) {
  min-height: clamp(104px, 13vh, 124px);
  padding: clamp(12px, 1.1vw, 16px);
}

:deep(.dashboard-page .primary-grid),
:deep(.dashboard-page .secondary-grid) {
  gap: clamp(10px, 1vw, 14px);
}

:deep(.dashboard-page .chart-card) {
  min-height: clamp(280px, 38vh, 360px);
}

:deep(.dashboard-page .quick) {
  height: clamp(44px, 5.5vh, 52px);
}

@media (max-width: 1260px) {
  :deep(.dashboard-page .dashboard-shell) {
    grid-template-columns: minmax(0, 1fr) 210px;
  }
}

@media (max-width: 1000px) {
  :deep(.dashboard-page .dashboard-shell) {
    grid-template-columns: 1fr;
  }
}
</style>
