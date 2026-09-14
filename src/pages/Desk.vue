<template>
  <div class="flex h-full min-h-0 min-w-0 overflow-hidden bg-[#F8FAFC]">
    <Transition name="sidebar">
      <!-- eslint-disable vue/require-explicit-emits -->
      <Sidebar
        v-show="showSidebar"
        class="h-full min-h-0 flex-shrink-0 border-e dark:border-gray-800 whitespace-nowrap w-sidebar"
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
</style>
