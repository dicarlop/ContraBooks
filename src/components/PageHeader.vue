<template>
  <div
    class="px-5 flex justify-between items-center h-row-largest flex-shrink-0 bg-white border-b border-slate-200"
    :class="[platform !== 'Windows' ? 'window-drag' : '']"
  >
    <Transition name="spacer" class="border-none">
      <div
        v-if="!showSidebar && platform === 'Mac' && languageDirection !== 'rtl'"
        class="h-full"
        :class="spacerClass"
      />
    </Transition>

    <div
      class="flex items-center window-no-drag gap-4 me-auto"
      :class="platform === 'Mac' && languageDirection === 'rtl' ? 'me-18' : ''"
    >
      <PageHeaderNavGroup />
      <h1
        v-if="title"
        class="text-2xl font-semibold text-slate-900 select-none whitespace-nowrap"
      >
        {{ title }}
      </h1>

      <div class="flex items-stretch window-no-drag gap-4">
        <slot name="left" />
      </div>
    </div>

    <div
      class="flex items-stretch window-no-drag gap-2 ms-auto"
      :class="platform === 'Mac' && languageDirection === 'rtl' ? 'me-18' : ''"
    >
      <slot />
    </div>
  </div>
</template>
<script lang="ts">
import { languageDirectionKey } from 'src/utils/injectionKeys';
import { showSidebar } from 'src/utils/refs';
import { defineComponent, inject, Transition } from 'vue';
import PageHeaderNavGroup from './PageHeaderNavGroup.vue';

export default defineComponent({
  components: { Transition, PageHeaderNavGroup },
  props: {
    title: { type: String, default: '' },
    border: { type: Boolean, default: true },
    searchborder: { type: Boolean, default: true },
  },
  setup() {
    return { showSidebar, languageDirection: inject(languageDirectionKey) };
  },
  computed: {
    showBorder() {
      return !!this.$slots.default && this.searchborder;
    },
    spacerClass() {
      if (this.showSidebar) return '';
      if (this.border) return 'w-tl me-4 border-e border-slate-200';
      return 'w-tl me-4';
    },
  },
});
</script>
<style scoped>
.w-tl {
  width: var(--w-trafficlights);
}

.spacer-enter-from,
.spacer-leave-to {
  opacity: 0;
  width: 0px;
  margin-right: 0px;
  border-right-width: 0px;
}

.spacer-enter-to,
.spacer-leave-from {
  opacity: 1;
  width: var(--w-trafficlights);
  margin-right: 1rem;
  border-right-width: 1px;
}

.spacer-enter-active,
.spacer-leave-active {
  transition: all 150ms ease-out;
}
</style>
