<template>
  <div class="desk-shell relative flex h-full min-h-0 min-w-0 overflow-hidden bg-[#F8FAFC]">
    <Transition name="sidebar">
      <!-- eslint-disable vue/require-explicit-emits -->
      <Sidebar v-show="showSidebar" class="desk-sidebar h-full min-h-0 self-stretch flex-shrink-0 whitespace-nowrap" :dark-mode="darkMode" @change-db-file="$emit('change-db-file')" />
    </Transition>
    <div class="relative flex min-h-0 min-w-0 flex-1 overflow-hidden bg-[#F8FAFC] dark:bg-gray-875">
      <Dashboard v-if="isInternalWindowRoute" class="min-h-0 min-w-0 flex-1" :dark-mode="darkMode" />
      <router-view v-else v-slot="{ Component }"><keep-alive><component :is="Component" :key="$route.path" :dark-mode="darkMode" class="min-h-0 min-w-0 flex-1" /></keep-alive></router-view>
      <router-view v-slot="{ Component, route }" name="edit"><Transition name="quickedit"><div v-if="route?.query?.edit"><component :is="Component" :key="route.query.schemaName + route.query.name" :dark-mode="darkMode" /></div></Transition></router-view>
      <div v-if="isInternalWindowRoute" class="internal-window-layer">
        <div class="internal-window-shadow"></div>
        <div class="internal-window-frame" :class="{ 'internal-window-frame-fullscreen': designerFullscreen }" :style="designerFrameStyle">
          <div class="internal-window-chrome" @mousedown="beginDesignerDrag">
            <span class="internal-window-title">Template Builder</span>
            <div class="internal-window-actions">
              <button class="internal-window-fullscreen" :aria-label="designerFullscreen ? 'Exit full screen' : 'Full screen'" :title="designerFullscreen ? 'Exit full screen' : 'Full screen'" @mousedown.stop @click.stop="toggleDesignerFullscreen">
                {{ designerFullscreen ? '↙' : '↗' }}
              </button>
              <button class="internal-window-close" aria-label="Close Template Builder" title="Close Template Builder" @mousedown.stop @click.stop="closeInternalWindow">×</button>
            </div>
          </div>
          <TemplateDesignerWindow :name="designerName" class="internal-task-window" />
        </div>
      </div>
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
import Dashboard from './Dashboard/Dashboard.vue';
import TemplateDesignerWindow from './TemplateDesignerWindow.vue';
const SWITCH_COMPANY_EVENT = 'contrabooks:switch-company';
export default defineComponent({
  name: 'Desk',
  components: { Sidebar, Dashboard, TemplateDesignerWindow },
  props: { darkMode: { type: Boolean, default: false } },
  emits: ['change-db-file'],
  data() {
    return {
      designerFullscreen: false,
      designerDragging: false,
      designerDragStartX: 0,
      designerDragStartY: 0,
      designerStartX: 0,
      designerStartY: 0,
    };
  },
  computed: {
    designerFrameStyle(): Record<string, string> {
      if (this.designerFullscreen) return {};
      return { transform: `translate(${this.designerStartX}px, ${this.designerStartY}px)` };
    },
    isInternalWindowRoute(): boolean { return this.$route.name === 'Template Builder' || this.$route.name === 'Visual Template Designer'; },
    designerName(): string { return typeof this.$route.params.name === 'string' ? decodeURIComponent(this.$route.params.name) : 'Professional Invoice'; },
  },
  mounted() {
    window.addEventListener(SWITCH_COMPANY_EVENT, this.handleSwitchCompany);
    window.addEventListener('keydown', this.handleWindowKeydown);
    window.addEventListener('mousemove', this.handleDesignerDrag);
    window.addEventListener('mouseup', this.endDesignerDrag);
  },
  beforeUnmount() {
    window.removeEventListener(SWITCH_COMPANY_EVENT, this.handleSwitchCompany);
    window.removeEventListener('keydown', this.handleWindowKeydown);
    window.removeEventListener('mousemove', this.handleDesignerDrag);
    window.removeEventListener('mouseup', this.endDesignerDrag);
  },
  methods: {
    handleSwitchCompany() { this.$emit('change-db-file'); },
    handleWindowKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape' && this.isInternalWindowRoute) {
        event.preventDefault();
        if (this.designerFullscreen) { this.designerFullscreen = false; return; }
        this.closeInternalWindow();
      }
    },
    closeInternalWindow() { void this.$router.push('/'); },
    toggleDesignerFullscreen() { this.designerFullscreen = !this.designerFullscreen; },
    beginDesignerDrag(event: MouseEvent) {
      if (this.designerFullscreen || event.button !== 0) return;
      this.designerDragging = true;
      this.designerDragStartX = event.clientX;
      this.designerDragStartY = event.clientY;
    },
    handleDesignerDrag(event: MouseEvent) {
      if (!this.designerDragging || this.designerFullscreen) return;
      this.designerStartX += event.clientX - this.designerDragStartX;
      this.designerStartY += event.clientY - this.designerDragStartY;
      this.designerDragStartX = event.clientX;
      this.designerDragStartY = event.clientY;
    },
    endDesignerDrag() { this.designerDragging = false; },
  },
});
</script>
<style scoped>
.desk-sidebar { width:230px; }
.sidebar-enter-from,.sidebar-leave-to { opacity:0; transform:translateX(-230px); width:0; }
[dir='rtl'] .sidebar-leave-to { opacity:0; transform:translateX(230px); }
.sidebar-enter-to,.sidebar-leave-from { opacity:1; transform:translateX(0); width:230px; }
.sidebar-enter-active,.sidebar-leave-active { transition:all 150ms ease-out; }

.internal-window-layer { position:absolute; inset:0; z-index:80; display:flex; align-items:center; justify-content:center; padding:18px; pointer-events:auto; }
.internal-window-shadow { position:absolute; inset:0; background:rgba(6,43,74,.08); pointer-events:none; }
.internal-window-frame { position:relative; pointer-events:auto; z-index:81; width:min(1480px,calc(100% - 8px)); height:min(900px,calc(100% - 8px)); min-width:0; min-height:0; pointer-events:auto; display:flex; flex-direction:column; }
.internal-window-frame-fullscreen { width:100%; height:100%; }
.internal-window-chrome { height:32px; flex:0 0 32px; display:flex; align-items:center; justify-content:space-between; padding:0 4px 0 12px; box-sizing:border-box; background:#F8FBFD; border:1px solid #C9D6DF; border-bottom:0; color:#49697D; cursor:move; user-select:none; }
.internal-window-title { font-size:10px; font-weight:700; color:#07345C; }
.internal-window-actions { display:flex; align-items:center; height:100%; gap:2px; }
.internal-window-fullscreen,.internal-window-close { width:28px; height:26px; display:grid; place-items:center; padding:0; border:0; border-radius:5px; background:transparent; color:#6B8496; font-size:16px; line-height:1; cursor:pointer; }
.internal-window-fullscreen:hover { background:#E8FAFC; color:#008E9F; }
.internal-window-close { font-size:21px; }
.internal-window-close:hover { background:#FDECEE; color:#E5484D; }
:deep(.internal-task-window) { position:relative; pointer-events:auto; width:100%; height:calc(100% - 32px); min-width:0; min-height:0; overflow:hidden; resize:both; box-shadow:0 18px 55px rgba(7,52,92,.28),0 2px 8px rgba(7,52,92,.18); }
.internal-window-frame-fullscreen :deep(.internal-task-window) { height:calc(100% - 32px); resize:none; }

:deep(.dashboard-page .dashboard-content) { height:100% !important; min-height:0 !important; grid-template-rows:minmax(108px,.9fr) minmax(155px,1.1fr) minmax(205px,2fr) minmax(145px,1.2fr) !important; gap:10px !important; overflow:hidden !important; align-content:stretch !important; }
:deep(.dashboard-page .dashboard-scroll) { min-height:0 !important; height:auto !important; overflow:hidden !important; }
:deep(.dashboard-page .workflow-card),:deep(.dashboard-page .workflow) { min-height:0 !important; }

@media(max-width:850px){
  :deep(.dashboard-page .dashboard-content) { height:100% !important; grid-template-rows:auto auto auto auto !important; overflow:auto !important; }
  :deep(.dashboard-page .dashboard-scroll) { overflow:auto !important; }
  .internal-window-frame { width:calc(100% - 8px); height:calc(100% - 8px); }
}
@media(max-width:1000px){.desk-sidebar{width:210px}.sidebar-enter-to,.sidebar-leave-from{width:210px}.sidebar-enter-from,.sidebar-leave-to{transform:translateX(-210px)}}
</style>