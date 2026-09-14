<template>
  <div
    class="relative window-drag flex items-center border-b bg-white text-slate-900 border-slate-200"
    style="height: 28px"
  >
    <img :src="logoUrl" alt="ContraBooks" class="ms-2 h-5 w-5" draggable="false" />
    <p v-if="companyName && dbPath" class="mx-auto text-sm">
      {{ companyName }} - {{ dbPath }}
    </p>
    <div
      v-if="!isFullscreen"
      class="absolute window-no-drag flex h-full items-center right-0"
    >
      <div
        class="flex items-center px-4 h-full hover:bg-slate-100"
        @click="minimizeWindow"
      >
        <feather-icon name="minus" class="h-4 w-4 flex-shrink-0" />
      </div>
      <div
        class="flex items-center px-4 h-full hover:bg-slate-100"
        @click="toggleMaximize"
      >
        <feather-icon
          v-if="isMax"
          name="minimize"
          class="h-3 w-3 flex-shrink-0"
        />
        <feather-icon v-else name="square" class="h-3 w-3 flex-shrink-0" />
      </div>
      <div
        class="flex items-center px-4 h-full hover:bg-red-600 hover:text-white"
        @click="closeWindow"
      >
        <feather-icon name="x" class="h-4 w-4 flex-shrink-0" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import logoUrl from 'src/assets/img/contrabooks-logo.svg';

export default {
  name: 'WindowsTitleBar',
  props: {
    dbPath: String,
    companyName: String,
  },
  data() {
    return {
      logoUrl,
      isMax: Boolean,
      isFullscreen: Boolean,
    };
  },
  mounted() {
    this.getIsMaximized();
    this.getIsFullscreen();
    window.addEventListener('resize', this.getIsFullscreen);
    document.addEventListener('webkitfullscreenchange', this.getIsFullscreen);
    document.addEventListener('mozfullscreenchange', this.getIsFullscreen);
    document.addEventListener('fullscreenchange', this.getIsFullscreen);
    document.addEventListener('MSFullscreenChange', this.getIsFullscreen);
  },
  destroyed() {
    window.removeEventListener('resize', this.getIsFullscreen);
    document.removeEventListener('webkitfullscreenchange', this.getIsFullscreen);
    document.removeEventListener('mozfullscreenchange', this.getIsFullscreen);
    document.removeEventListener('fullscreenchange', this.getIsFullscreen);
    document.removeEventListener('MSFullscreenChange', this.getIsFullscreen);
  },
  methods: {
    minimizeWindow() {
      ipc.minimizeWindow();
    },
    toggleMaximize() {
      ipc.toggleMaximize();
      this.getIsMaximized();
    },
    closeWindow() {
      ipc.closeWindow();
    },
    getIsMaximized() {
      ipc.isMaximized().then((result) => {
        this.isMax = result;
      }).catch((error) => {
        console.error(error);
      });
    },
    getIsFullscreen() {
      ipc.isFullscreen().then((result) => {
        this.isFullscreen = result;
      }).catch((error) => {
        console.error(error);
      });
    },
  },
};
</script>
