<template>
  <div class="h-full flex flex-col">
    <PageHeader :title="t`Customize Form`">
      <DropdownWithActions :actions="[]" :disabled="true" :title="t`More`" />
      <Button :title="t`Save Customizations`" type="primary" :disabled="!formType" @click="saveCustomizations">
        {{ t`Save` }}
      </Button>
    </PageHeader>

    <div class="flex-1 overflow-auto custom-scroll">
      <div class="flex flex-col xl:flex-row min-h-full">
        <aside class="w-full xl:w-80 flex-shrink-0 border-b xl:border-b-0 xl:border-r dark:border-gray-800 p-4 space-y-4">
          <div>
            <label class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ t`Document` }}</label>
            <AutoComplete
              :df="{ fieldname: 'formType', label: t`Form Type`, fieldtype: 'AutoComplete', options: customizableSchemas }"
              input-class="bg-transparent text-gray-900 dark:text-gray-100 text-base"
              class="w-full mt-2"
              :border="true"
              :value="formType"
              size="small"
              @change="setEntryType"
            />
          </div>

          <div v-if="formType" class="space-y-4">
            <section class="rounded-lg border dark:border-gray-800 p-4 space-y-3">
              <h3 class="font-semibold">{{ t`Brand` }}</h3>
              <div>
                <label class="text-sm text-gray-700 dark:text-gray-300">{{ t`Accent colour` }}</label>
                <div class="flex gap-2 items-center mt-1">
                  <input v-model="customization.accent" type="color" class="h-9 w-12 rounded cursor-pointer" />
                  <input v-model="customization.accent" type="text" class="flex-1 h-9 px-2 rounded border bg-transparent dark:border-gray-700" />
                </div>
              </div>
              <div>
                <label class="text-sm text-gray-700 dark:text-gray-300">{{ t`Header style` }}</label>
                <select v-model="customization.headerStyle" class="w-full mt-1 h-9 px-2 rounded border bg-transparent dark:border-gray-700">
                  <option value="clean">{{ t`Clean` }}</option>
                  <option value="band">{{ t`Colour band` }}</option>
                  <option value="boxed">{{ t`Boxed` }}</option>
                </select>
              </div>
            </section>

            <section class="rounded-lg border dark:border-gray-800 p-4 space-y-3">
              <h3 class="font-semibold">{{ t`Typography` }}</h3>
              <div>
                <label class="text-sm text-gray-700 dark:text-gray-300">{{ t`Font` }}</label>
                <select v-model="customization.font" class="w-full mt-1 h-9 px-2 rounded border bg-transparent dark:border-gray-700">
                  <option value="system">{{ t`System` }}</option>
                  <option value="inter">Inter</option>
                  <option value="serif">{{ t`Serif` }}</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-gray-700 dark:text-gray-300">{{ t`Density` }}</label>
                <select v-model="customization.density" class="w-full mt-1 h-9 px-2 rounded border bg-transparent dark:border-gray-700">
                  <option value="comfortable">{{ t`Comfortable` }}</option>
                  <option value="compact">{{ t`Compact` }}</option>
                </select>
              </div>
            </section>

            <section class="rounded-lg border dark:border-gray-800 p-4 space-y-3">
              <h3 class="font-semibold">{{ t`Sections` }}</h3>
              <label class="flex items-center gap-2 text-sm"><input v-model="customization.showLogo" type="checkbox" /> {{ t`Show company logo` }}</label>
              <label class="flex items-center gap-2 text-sm"><input v-model="customization.showAddress" type="checkbox" /> {{ t`Show company address` }}</label>
              <label class="flex items-center gap-2 text-sm"><input v-model="customization.showPaymentTerms" type="checkbox" /> {{ t`Show payment terms` }}</label>
              <label class="flex items-center gap-2 text-sm"><input v-model="customization.showNotes" type="checkbox" /> {{ t`Show notes section` }}</label>
            </section>

            <button class="w-full text-sm border rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800" @click="resetCustomizations">
              {{ t`Reset to recommended` }}
            </button>
          </div>

          <p v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>
          <p v-else-if="saveMessage" class="text-sm text-green-600 dark:text-green-400">{{ saveMessage }}</p>
          <p v-else-if="!formType" class="text-sm text-gray-600 dark:text-gray-300">{{ t`Select a form type to customize` }}</p>
        </aside>

        <main v-if="formType" class="flex-1 p-4 md:p-8 bg-gray-50 dark:bg-gray-950">
          <div class="max-w-3xl mx-auto">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-gray-100">{{ t`Live Preview` }}</h2>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ t`Changes are previewed safely before they are saved.` }}</p>
              </div>
              <span class="text-xs px-2 py-1 rounded-full border dark:border-gray-700">{{ t`Sample document` }}</span>
            </div>

            <div
              class="bg-white text-gray-900 shadow-sm rounded-lg overflow-hidden"
              :class="[fontClass, customization.density === 'compact' ? 'text-sm' : 'text-base']"
            >
              <div
                class="p-6 border-b"
                :class="customization.headerStyle === 'band' ? 'text-white border-transparent' : ''"
                :style="customization.headerStyle === 'band' ? { backgroundColor: customization.accent } : {}"
              >
                <div class="flex justify-between gap-6 items-start">
                  <div>
                    <div v-if="customization.showLogo" class="w-28 h-9 mb-3 rounded border border-dashed flex items-center justify-center text-xs opacity-60">{{ t`Your logo` }}</div>
                    <div class="text-xl font-bold">{{ t`ContraBooks` }}</div>
                    <div v-if="customization.showAddress" class="text-xs mt-1 opacity-70">{{ t`Your company address` }} · {{ t`Phone` }} · {{ t`Email` }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-2xl font-bold">{{ formType }}</div>
                    <div class="text-xs mt-1 opacity-70">#CB-0001 · {{ t`September 16, 2026` }}</div>
                  </div>
                </div>
              </div>

              <div class="p-6 space-y-5">
                <div class="grid grid-cols-2 gap-6">
                  <div><div class="text-xs uppercase tracking-wide opacity-60">{{ t`Bill to` }}</div><div class="font-medium mt-1">{{ t`Sample Customer` }}</div><div class="text-sm opacity-70">{{ t`Customer address` }}</div></div>
                  <div class="text-right"><div class="text-xs uppercase tracking-wide opacity-60">{{ t`Amount due` }}</div><div class="text-2xl font-bold mt-1" :style="{ color: customization.accent }">$1,250.00</div></div>
                </div>

                <div :class="customization.headerStyle === 'boxed' ? 'border rounded-lg overflow-hidden' : 'border-t border-b'">
                  <div class="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide" :style="{ backgroundColor: customization.accent + '18' }">
                    <div class="col-span-7">{{ t`Description` }}</div><div class="col-span-2 text-right">{{ t`Qty` }}</div><div class="col-span-3 text-right">{{ t`Amount` }}</div>
                  </div>
                  <div class="grid grid-cols-12 gap-2 px-3 py-3 border-t"><div class="col-span-7">{{ t`Professional services` }}</div><div class="col-span-2 text-right">1</div><div class="col-span-3 text-right">$1,250.00</div></div>
                </div>

                <div class="flex justify-end"><div class="w-64 space-y-2"><div class="flex justify-between"><span>{{ t`Subtotal` }}</span><span>$1,250.00</span></div><div class="flex justify-between font-bold pt-2 border-t" :style="{ color: customization.accent }"><span>{{ t`Total` }}</span><span>$1,250.00</span></div></div></div>
                <div v-if="customization.showPaymentTerms" class="p-3 rounded" :style="{ backgroundColor: customization.accent + '10' }"><div class="font-medium">{{ t`Payment terms` }}</div><div class="text-sm opacity-70 mt-1">{{ t`Payment due within 30 days.` }}</div></div>
                <div v-if="customization.showNotes" class="text-sm opacity-70 pt-2">{{ t`Notes: Thank you for your business.` }}</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import Button from 'src/components/Button.vue';
import PageHeader from 'src/components/PageHeader.vue';
import AutoComplete from 'src/components/Controls/AutoComplete.vue';
import { ModelNameEnum } from 'models/types';

type TemplateCustomization = {
  accent: string;
  headerStyle: 'clean' | 'band' | 'boxed';
  font: 'system' | 'inter' | 'serif';
  density: 'comfortable' | 'compact';
  showLogo: boolean;
  showAddress: boolean;
  showPaymentTerms: boolean;
  showNotes: boolean;
};

const DEFAULT_CUSTOMIZATION: TemplateCustomization = {
  accent: '#16a085',
  headerStyle: 'clean',
  font: 'system',
  density: 'comfortable',
  showLogo: true,
  showAddress: true,
  showPaymentTerms: true,
  showNotes: true,
};

export default defineComponent({
  components: { PageHeader, Button, DropdownWithActions, AutoComplete },
  data() {
    return {
      errorMessage: '',
      saveMessage: '',
      formType: '',
      customization: { ...DEFAULT_CUSTOMIZATION } as TemplateCustomization,
    };
  },
  computed: {
    customizableSchemas() {
      const schemaNames = Object.keys(this.fyo.schemaMap).filter((schemaName) => {
        const schema = this.fyo.schemaMap[schemaName];
        if (!schema || schema.isSingle) return false;
        return ![
          ModelNameEnum.NumberSeries,
          ModelNameEnum.SingleValue,
          ModelNameEnum.SetupWizard,
          ModelNameEnum.PatchRun,
        ].includes(schemaName as ModelNameEnum);
      });
      return schemaNames.map((sn) => ({ value: sn, label: this.fyo.schemaMap[sn]?.label ?? sn }));
    },
    fontClass() {
      if (this.customization.font === 'serif') return 'font-serif';
      if (this.customization.font === 'inter') return 'font-sans';
      return 'font-sans';
    },
  },
  methods: {
    setEntryType(type: string) {
      this.formType = type;
      this.errorMessage = '';
      this.saveMessage = '';
      this.loadCustomizations();
    },
    storageKey(): string {
      return `contrabooks.template-customization.${this.formType}`;
    },
    loadCustomizations(): void {
      if (!this.formType || typeof window === 'undefined') return;
      try {
        const stored = window.localStorage.getItem(this.storageKey());
        this.customization = stored
          ? { ...DEFAULT_CUSTOMIZATION, ...JSON.parse(stored) }
          : { ...DEFAULT_CUSTOMIZATION };
      } catch {
        this.customization = { ...DEFAULT_CUSTOMIZATION };
      }
    },
    saveCustomizations(): void {
      if (!this.formType || typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(this.storageKey(), JSON.stringify(this.customization));
        this.errorMessage = '';
        this.saveMessage = this.t`Customizations saved`;
      } catch {
        this.saveMessage = '';
        this.errorMessage = this.t`Unable to save customizations on this device`;
      }
    },
    resetCustomizations(): void {
      this.customization = { ...DEFAULT_CUSTOMIZATION };
      this.saveMessage = '';
      this.errorMessage = '';
    },
  },
});
</script>
