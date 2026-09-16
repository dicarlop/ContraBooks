<template>
  <div
    ref="container"
    class="bg-white dark:bg-gray-875 text-gray-900 dark:text-gray-100"
  >
    <div
      v-if="!disabled && (quickInsertOptions.length || fieldGroups.length || printSettings)"
      class="sticky top-0 z-10 flex flex-wrap items-center gap-2 p-2 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-850"
    >
      <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">
        {{ t`Quick Insert` }}
      </span>
      <button
        v-for="option in quickInsertOptions"
        :key="option.value"
        type="button"
        class="px-2 py-1 text-xs rounded border bg-white dark:bg-gray-900 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
        @mousedown.prevent
        @click="insertPlaceholder(option.value)"
      >
        {{ option.label }}
      </button>
      <select
        v-if="fieldGroups.length"
        v-model="selectedField"
        class="px-2 py-1 text-xs rounded border bg-white dark:bg-gray-900 dark:border-gray-700 max-w-xs"
        aria-label="Insert Field"
        @mousedown.stop
        @change="insertSelectedField"
      >
        <option value="">{{ t`Insert Field...` }}</option>
        <optgroup
          v-for="group in fieldGroups"
          :key="group.label"
          :label="group.label"
        >
          <option
            v-for="option in group.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </optgroup>
      </select>
      <div
        v-if="printSettings"
        class="ml-auto flex items-center gap-2 pl-2 border-l dark:border-gray-700"
      >
        <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">
          {{ t`Company Logo` }}
        </span>
        <AttachImage
          :df="logoField"
          :value="logoValue"
          size="small"
          class="flex-shrink-0"
          @change="setLogo"
        />
        <button
          type="button"
          class="px-2 py-1 text-xs rounded border bg-white dark:bg-gray-900 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          :disabled="!logoValue"
          @mousedown.prevent
          @click="insertLogo"
        >
          {{ t`Insert Logo` }}
        </button>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { vue } from '@codemirror/lang-vue';
import {
  HighlightStyle,
  syntaxHighlighting,
  syntaxTree,
} from '@codemirror/language';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { basicSetup } from 'codemirror';
import { Doc } from 'fyo/model/doc';
import { ModelNameEnum } from 'models/types';
import { Field } from 'schemas/types';
import AttachImage from 'src/components/Controls/AttachImage.vue';
import { uicolors } from 'src/utils/colors';
import { defineComponent, markRaw } from 'vue';

const quickInsertCandidates = [
  { label: 'Document #', value: 'doc.name' },
  { label: 'Date', value: 'doc.date' },
  { label: 'Total', value: 'doc.grandTotal' },
  { label: 'Company', value: 'print.companyName' },
  { label: 'Email', value: 'print.email' },
  { label: 'Phone', value: 'print.phone' },
  { label: 'Address', value: 'print.address' },
  { label: 'Entry Type', value: 'doc.entryLabel' },
] as const;

type FieldOption = {
  label: string;
  value: string;
};

type FieldGroup = {
  label: string;
  options: FieldOption[];
};

export default defineComponent({
  components: { AttachImage },
  props: {
    initialValue: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    hints: { type: Object, default: undefined },
  },
  emits: ['input', 'blur'],
  data() {
    return {
      state: null,
      view: null,
      compartments: {},
      selectedField: '',
      printSettings: null,
    } as {
      state: EditorState | null;
      view: EditorView | null;
      compartments: Record<string, Compartment>;
      selectedField: string;
      printSettings: Doc | null;
    };
  },
  computed: {
    container() {
      const { container } = this.$refs;
      if (container instanceof HTMLDivElement) {
        return container;
      }

      throw new Error('ref container is not a div element');
    },
    quickInsertOptions() {
      return quickInsertCandidates.filter(({ value }) =>
        hasHintPath(this.hints, value)
      );
    },
    fieldGroups(): FieldGroup[] {
      const fields = flattenHintPaths(this.hints);
      const groups = new Map<string, FieldOption[]>();

      for (const field of fields) {
        const separator = field.value.indexOf('.');
        const group = separator === -1 ? 'Other' : field.value.slice(0, separator);
        const options = groups.get(group) ?? [];
        options.push({
          ...field,
          label: separator === -1 ? field.label : field.value.slice(separator + 1),
        });
        groups.set(group, options);
      }

      return Array.from(groups.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, options]) => ({
          label,
          options: options.sort((a, b) => a.label.localeCompare(b.label)),
        }));
    },
    logoField(): Field {
      return {
        fieldname: 'logo',
        label: this.t`Company Logo`,
        fieldtype: 'AttachImage',
      } as Field;
    },
    logoValue(): string {
      return (this.printSettings?.get('logo') as string | null) ?? '';
    },
  },
  watch: {
    disabled(value: boolean) {
      this.setDisabled(value);
    },
  },
  async mounted() {
    await this.loadPrintSettings();

    if (!this.view) {
      this.init();
    }

    if (this.fyo.store.isDevelopment) {
      // @ts-ignore
      window.te = this;
    }
  },
  methods: {
    async loadPrintSettings() {
      try {
        this.printSettings = await this.fyo.doc.getDoc(ModelNameEnum.PrintSettings);
      } catch {
        this.printSettings = null;
      }
    },
    async setLogo(value: unknown) {
      if (!this.printSettings || (typeof value !== 'string' && value !== null)) {
        return;
      }

      await this.printSettings.set('logo', value);
      if (typeof value === 'string' && value.length) {
        await this.printSettings.set('displayLogo', true);
      }
      await this.printSettings.sync();
      this.$emit('input', this.view?.state.doc.toString() ?? '');
    },
    insertLogo() {
      if (this.disabled || !this.view || !this.logoValue) {
        return;
      }

      const logo =
        '<img v-if="print.logo" :src="print.logo" alt="Company Logo" style="max-height: 80px; max-width: 240px; object-fit: contain;" />';
      const selection = this.view.state.selection.main;
      this.view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: logo,
        },
        selection: {
          anchor: selection.from + logo.length,
        },
      });
      this.view.focus();
    },
    init() {
      const readOnly = new Compartment();
      const editable = new Compartment();

      const highlightStyle = HighlightStyle.define([
        { tag: tags.typeName, color: uicolors.pink[600] },
        { tag: tags.angleBracket, color: uicolors.pink[600] },
        { tag: tags.attributeName, color: uicolors.gray[500] },
        { tag: tags.attributeValue, color: uicolors.blue[500] },
        { tag: tags.comment, color: uicolors.gray[500], fontStyle: 'italic' },
        { tag: tags.keyword, color: uicolors.orange[600] },
        { tag: tags.variableName, color: uicolors.teal[600] },
        { tag: tags.string, color: uicolors.blue[700] },
      ]);
      const completions = getCompletionsFromHints(this.hints ?? {});

      const view = new EditorView({
        doc: this.initialValue,
        extensions: [
          EditorView.updateListener.of(this.updateListener.bind(this)),
          readOnly.of(EditorState.readOnly.of(this.disabled)),
          editable.of(EditorView.editable.of(!this.disabled)),
          basicSetup,
          vue(),
          syntaxHighlighting(highlightStyle),
          autocompletion({ override: [completions] }),
        ],
        parent: this.container,
      });
      this.view = markRaw(view);

      const compartments = { readOnly, editable };
      this.compartments = markRaw(compartments);
    },
    updateListener(update: ViewUpdate) {
      if (update.docChanged) {
        this.$emit('input', this.view?.state.doc.toString() ?? '');
      }

      if (update.focusChanged && !this.view?.hasFocus) {
        this.$emit('blur', this.view?.state.doc.toString() ?? '');
      }
    },
    insertSelectedField() {
      if (!this.selectedField) {
        return;
      }

      const value = this.selectedField;
      this.selectedField = '';
      this.insertPlaceholder(value);
    },
    insertPlaceholder(value: string) {
      if (this.disabled || !this.view) {
        return;
      }

      const placeholder = `{{ ${value} }}`;
      const selection = this.view.state.selection.main;
      this.view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: placeholder,
        },
        selection: {
          anchor: selection.from + placeholder.length,
        },
      });
      this.view.focus();
    },
    setDisabled(value: boolean) {
      const { readOnly, editable } = this.compartments;
      this.view?.dispatch({
        effects: [
          readOnly.reconfigure(EditorState.readOnly.of(value)),
          editable.reconfigure(EditorView.editable.of(!value)),
        ],
      });
    },
  },
});

function hasHintPath(hints: object | undefined, path: string): boolean {
  if (!hints) {
    return false;
  }

  let current: unknown = hints;
  for (const segment of path.split('.')) {
    if (typeof current !== 'object' || current === null) {
      return false;
    }

    if (!Object.prototype.hasOwnProperty.call(current, segment)) {
      return false;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return true;
}

function flattenHintPaths(
  hints: object | undefined,
  prefix = ''
): FieldOption[] {
  if (!hints) {
    return [];
  }

  const fields: FieldOption[] = [];
  for (const [key, value] of Object.entries(hints)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      fields.push({ label: path, value: path });
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      fields.push(...flattenHintPaths(value, path));
      continue;
    }

    fields.push({ label: path, value: path });
  }

  return fields.sort((a, b) => a.label.localeCompare(b.label));
}

function getCompletionsFromHints(hints: Record<string, unknown>) {
  const options = hintsToCompletionOptions(hints);
  return function completions(context: CompletionContext) {
    let word = context.matchBefore(/\w*/);
    if (word == null) {
      return null;
    }

    const node = syntaxTree(context.state).resolveInner(context.pos);
    const aptLocation = ['ScriptAttributeValue', 'SingleExpression'];

    if (!aptLocation.includes(node.name)) {
      return null;
    }

    if (word.from === word.to && !context.explicit) {
      return null;
    }

    return {
      from: word.from,
      options,
    };
  };
}

type CompletionOption = {
  label: string;
  type: string;
  detail: string;
};

function hintsToCompletionOptions(
  hints: object,
  prefix?: string
): CompletionOption[] {
  prefix ??= '';
  const list: CompletionOption[] = [];

  for (const [key, value] of Object.entries(hints)) {
    const option = getCompletionOption(key, value, prefix);
    if (option === null) {
      continue;
    }

    if (Array.isArray(option)) {
      list.push(...option);
      continue;
    }

    list.push(option);
  }

  return list;
}

function getCompletionOption(
  key: string,
  value: unknown,
  prefix: string
): null | CompletionOption | CompletionOption[] {
  let label = key;
  if (prefix.length) {
    label = prefix + '.' + key;
  }

  if (Array.isArray(value)) {
    return {
      label,
      type: 'variable',
      detail: 'Child Table',
    };
  }

  if (typeof value === 'string') {
    return {
      label,
      type: 'variable',
      detail: value,
    };
  }

  if (typeof value === 'object' && value !== null) {
    return hintsToCompletionOptions(value, label);
  }

  return null;
}
</script>
<style>
.cm-line {
  font-weight: 600;
}

.cm-gutter {
  @apply bg-gray-50 dark:bg-gray-850;
}

.cm-gutters {
  border: none black !important;
  border-right: 1px solid theme('colors.gray.200') !important;
}

.dark .cm-gutters {
  border: none white !important;
  border-right: 1px solid theme('colors.gray.800') !important;
}

.cm-activeLine,
.cm-activeLineGutter {
  background-color: #72839216 !important;
}

.cm-tooltip-autocomplete {
  background-color: white !important;
  border: 1px solid theme('colors.gray.200') !important;
  @apply rounded shadow-lg overflow-hidden text-gray-900;
}

.dark .cm-tooltip-autocomplete {
  background-color: black !important;
  border: 1px solid theme('colors.gray.800') !important;
  @apply rounded shadow-lg overflow-hidden text-gray-100;
}

.cm-panels {
  border-top: 1px solid theme('colors.gray.200') !important;
  background-color: theme('colors.gray.50') !important;
  color: theme('colors.gray.800') !important;
}

.cm-button {
  background-image: none !important;
  background-color: theme('colors.gray.200') !important;
  color: theme('colors.gray.700') !important;
  border: none !important;
}

.cm-textfield {
  border: 1px solid theme('colors.gray.200') !important;
}
</style>
