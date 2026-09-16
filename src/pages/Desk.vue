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
:deep(.dashboard-page .dashboard-topbar .dashboard-logo){display:none}
:deep(.dashboard-page){zoom:1;overflow:hidden}
:deep(.dashboard-page .dashboard-scroll){overflow:hidden}
:deep(.dashboard-page .dashboard-content){grid-template-rows:64px 154px 176px minmax(215px,1fr) 174px;gap:4px;padding:6px 20px 7px}
:deep(.dashboard-page .workflow-card){padding:9px 14px}
:deep(.dashboard-page .workflow-title){height:34px}
:deep(.dashboard-page .workflow){height:110px}
:deep(.dashboard-page .workflow-step){height:110px}
:deep(.dashboard-page .panel){padding-top:8px}
:deep(.dashboard-page .panel-title){height:28px}
:deep(.dashboard-page .table-head){height:24px}
:deep(.dashboard-page .table-row){height:24px}
:deep(.dashboard-page .bottom .table-row){height:24px}
:deep(.dashboard-page .dashboard-content > .middle){min-height:0}
:deep(.dashboard-page .dashboard-content > .bottom){min-height:0}
@media(max-height:850px){
  :deep(.dashboard-page .dashboard-content){grid-template-rows:60px 142px 166px minmax(200px,1fr) 162px;gap:3px;padding:5px 16px 6px}
  :deep(.dashboard-page .workflow-card){padding:7px 12px}
  :deep(.dashboard-page .workflow-title){height:31px}
  :deep(.dashboard-page .workflow),:deep(.dashboard-page .workflow-step){height:103px}
  :deep(.dashboard-page .panel-title){height:26px}
  :deep(.dashboard-page .table-head),:deep(.dashboard-page .table-row){height:23px}
}
@media(max-width:1000px){.desk-sidebar{width:210px}.sidebar-enter-to,.sidebar-leave-from{width:210px}.sidebar-enter-from,.sidebar-leave-to{transform:translateX(-210px)}}
</style>
