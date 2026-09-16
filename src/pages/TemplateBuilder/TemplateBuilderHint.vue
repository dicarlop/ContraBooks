<template>
  <div :class="level > 0 ? 'ms-2 ps-2 border-l dark:border-gray-800' : ''">
    <template v-for="r of rows" :key="r.key">
      <div
        class="flex gap-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap overflow-auto no-scrollbar items-center"
        :class="[typeof r.value === 'object' ? 'cursor-pointer' : '']"
        @click="r.collapsed = !r.collapsed"
      >
        <div>{{ getKey(r) }}</div>
        <div
          v-if="!r.isCollapsible"
          class="font-semibold text-gray-800 dark:text-gray-200"
        >
          {{ r.value }}
        </div>
        <div
          v-else-if="Array.isArray(r.value)"
          class="text-blue-600 dark:text-blue-100 bg-blue-100 dark:bg-blue-600 border-white dark:border-blue-600 border tracking-tighter rounded text-xs px-1"
        >
          Array
        </div>
        <div
          v-else
          class="text-pink-600 dark:text-pink-100 bg-pink-100 dark:bg-pink-600 border-white dark:border-pink-600 border tracking-tighter rounded text-xs px-1"
        >
          Object
        </div>

        <button
          v-if="!r.isCollapsible"
          type="button"
          class="ms-auto px-1.5 py-0.5 text-xs rounded border bg-white dark:bg-gray-900 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          @click.stop="emitInsert(getKey(r))"
        >
          {{ t`Insert` }}
        </button>

        <feather-icon
          v-if="r.isCollapsible"
          :name="r.collapsed ? 'chevron-up' : 'chevron-down'"
          class="w-4 h-4 ms-auto"
        />
      </div>
      <div v-if="!r.collapsed && typeof r.value === 'object'">
        <TemplateBuilderHint
          :prefix="getKey(r)"
          :hints="Array.isArray(r.value) ? r.value[0] : r.value"
          :level="level + 1"
          @insert-field="emitInsert"
        />
      </div>
    </template>
  </div>
</template>
<script lang="ts">
import { PrintTemplateHint } from 'src/utils/printTemplates';
import { PropType } from 'vue';
import { defineComponent } from 'vue';
type HintRow = {
  key: string;
  value: PrintTemplateHint[string];
  isCollapsible: boolean;
  collapsed: boolean;
};
export default defineComponent({
  name: 'TemplateBuilderHint',
  emits: ['insert-field'],
  props: {
    prefix: { type: String, default: '' },
    hints: {
      type: Object as PropType<PrintTemplateHint>,
      required: true,
    },
    level: { type: Number, default: 0 },
  },
  data() {
    return { rows: [] } as {
      rows: HintRow[];
    };
  },
  mounted() {
    this.rows = Object.entries(this.hints)
      .map(([key, value]) => ({
        key,
        value,
        isCollapsible: typeof value === 'object',
        collapsed: this.level > 0,
      }))
      .sort((a, b) => Number(a.isCollapsible) - Number(b.isCollapsible));
  },
  methods: {
    getKey(row: HintRow) {
      const isArray = Array.isArray(row.value);
      if (isArray) {
        return `${this.prefix}.${row.key}[number]`;
      }

      if (this.prefix.length) {
        return `${this.prefix}.${row.key}`;
      }

      return row.key;
    },
    emitInsert(value: string) {
      this.$emit('insert-field', value);
    },
  },
});
</script>
