<template>
  <div class="desk-shell flex h-full min-h-0 min-w-0 overflow-hidden bg-[#F8FAFC]">
    <Transition name="sidebar">
      <!-- eslint-disable vue/require-explicit-emits -->
      <Sidebar v-show="showSidebar" class="desk-sidebar h-full min-h-0 self-stretch flex-shrink-0 whitespace-nowrap" :dark-mode="darkMode" @change-db-file="$emit('change-db-file')" />
    </Transition>
    <div class="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-[#F8FAFC] dark:bg-gray-875">
      <router-view v-slot="{ Component }"><keep-alive><component :is="Component" :key="$route.path" :dark-mode="darkMode" class="min-h-0 min-w-0 flex-1" /></keep-alive></router-view>
      <router-view v-slot="{ Component, route }" name="edit"><Transition name="quickedit"><div v-if="route?.query?.edit"><component :is="Component" :key="route.query.schemaName + route.query.name" :dark-mode="darkMode" /></div></Transition></router-view>
    </div>
    <button v-show="!showSidebar" class="absolute bottom-0 start-0 m-4 rounded p-1 text-gray-600 opacity-0 hover:bg-gray-100 hover:opacity-100 hover:shadow-md dark:text-gray-400 dark:hover:bg-gray-900 rtl-rotate-180" @click="() => toggleSidebar()"><feather-icon name="chevrons-right" class="h-4 w-4" /></button>
  </div>
</template>
<script setup lang="ts">
import { showSidebar } from 'src/utils/refs';
import { toggleSidebar } from 'src/utils/ui';
</script>
<script lang="ts">
import { defineComponent } from 'vue';
import Sidebar from '../components/Sidebar.vue';
const SWITCH_COMPANY_EVENT = 'contrabooks:switch-company';
export default defineComponent({
  name: 'Desk',
  components: { Sidebar },
  props: { darkMode: { type: Boolean, default: false } },
  emits: ['change-db-file'],
  mounted() { window.addEventListener(SWITCH_COMPANY_EVENT, this.handleSwitchCompany); },
  beforeUnmount() { window.removeEventListener(SWITCH_COMPANY_EVENT, this.handleSwitchCompany); },
  methods: { handleSwitchCompany() { this.$emit('change-db-file'); } },
});
</script>
<style scoped>
.desk-sidebar { width:230px; }
.sidebar-enter-from,.sidebar-leave-to { opacity:0; transform:translateX(-230px); width:0; }
[dir='rtl'] .sidebar-leave-to { opacity:0; transform:translateX(230px); }
.sidebar-enter-to,.sidebar-leave-from { opacity:1; transform:translateX(0); width:230px; }
.sidebar-enter-active,.sidebar-leave-active { transition:all 150ms ease-out; }

/* The dashboard owns its responsive layout. Keep the shell from forcing a second grid. */
@media(min-height:851px){
  :deep(.dashboard-page .dashboard-scroll){overflow:hidden}
  :deep(.dashboard-page .dashboard-content){height:auto;min-height:0;grid-template-rows:max-content max-content max-content max-content max-content;gap:8px;padding:10px 20px 12px;align-content:start}
  :deep(.dashboard-page .middle){min-height:170px}
}

/* Keep the six-step Desktop Pro workflow on one line at normal desktop widths. */
@media(min-width:901px){
  :deep(.dashboard-page .workflow){grid-template-columns:minmax(0,1fr) 20px minmax(0,1fr) 20px minmax(0,1fr) 20px minmax(0,1fr) 20px minmax(0,1fr) 20px minmax(0,1fr);height:116px;gap:0}
  :deep(.dashboard-page .workflow-step){height:116px;display:flex;padding:10px 12px;text-align:center}
  :deep(.dashboard-page .workflow-step .number){position:absolute}
  :deep(.dashboard-page .workflow-step>svg){width:28px!important;height:28px!important;margin-bottom:7px}
  :deep(.dashboard-page .workflow-step b),:deep(.dashboard-page .workflow-step small){text-align:center;max-width:180px;white-space:normal}
}

@media(max-width:1000px){.desk-sidebar{width:210px}.sidebar-enter-to,.sidebar-leave-from{width:210px}.sidebar-enter-from,.sidebar-leave-to{transform:translateX(-210px)}}
</style>