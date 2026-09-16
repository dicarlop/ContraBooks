<template>
  <div class="flex h-full w-full flex-col overflow-hidden bg-[#F8FAFC]">
    <PageHeader :title="t`Backup & Export`">
      <Button type="primary" :disabled="loading" @click="saveBackup">
        <feather-icon name="download" class="me-2 h-4 w-4" />
        {{ loading ? t`Creating Backup...` : t`Create Backup` }}
      </Button>
    </PageHeader>

    <div class="flex min-h-0 flex-1 items-start justify-center overflow-auto p-6">
      <div class="w-full max-w-3xl space-y-4">
        <section class="rounded-2xl border border-[#DCE7EF] bg-white p-6 shadow-sm">
          <div class="flex items-start gap-4">
            <div class="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-[#E8FAFC] text-[#00AFC1]">
              <feather-icon name="shield" class="h-6 w-6" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-[#07345C]">{{ t`Protect your company file` }}</h2>
              <p class="mt-1 text-sm text-slate-500">
                {{ t`Create a portable JSON snapshot of your ContraBooks data for safekeeping or migration.` }}
              </p>
            </div>
          </div>

          <div class="mt-6 grid gap-3 sm:grid-cols-3">
            <div class="rounded-xl bg-[#F8FAFC] p-4">
              <span class="text-xs text-slate-400">{{ t`Company` }}</span>
              <strong class="mt-1 block truncate text-sm text-[#07345C]">{{ companyName || t`Company file` }}</strong>
            </div>
            <div class="rounded-xl bg-[#F8FAFC] p-4">
              <span class="text-xs text-slate-400">{{ t`Records` }}</span>
              <strong class="mt-1 block text-sm text-[#07345C]">{{ recordCount.toLocaleString() }}</strong>
            </div>
            <div class="rounded-xl bg-[#F8FAFC] p-4">
              <span class="text-xs text-slate-400">{{ t`Schemas` }}</span>
              <strong class="mt-1 block text-sm text-[#07345C]">{{ schemaCount }}</strong>
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-[#DCE7EF] bg-white p-6 shadow-sm">
          <h3 class="text-sm font-semibold text-[#07345C]">{{ t`What's included` }}</h3>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div v-for="item in included" :key="item" class="flex items-center gap-2 text-sm text-slate-600">
              <span class="grid h-6 w-6 place-items-center rounded-full bg-[#E8F8F2] text-[#10A874]">✓</span>
              {{ item }}
            </div>
          </div>
          <p class="mt-5 rounded-xl bg-[#FFF8E8] p-3 text-xs leading-5 text-[#8A6500]">
            {{ t`Backup files contain your company data. Store them securely and use a trusted location for long-term retention.` }}
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from 'fyo';
import Button from 'src/components/Button.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { createBackupSnapshot, getBackupFileName } from 'src/utils/backup';
import { getSavePath, showExportInFolder } from 'src/utils/ui';
import { docsPathRef } from 'src/utils/refs';
import { showToast } from 'src/utils/interactive';
import { defineComponent } from 'vue';
import { fyo } from 'src/initFyo';

export default defineComponent({
  name: 'BackupWizard',
  components: { Button, PageHeader },
  data() {
    return { loading: false, companyName: '', recordCount: 0, schemaCount: 0 };
  },
  computed: {
    included(): string[] {
      return [
        t`Customers, suppliers, and accounts`,
        t`Invoices, payments, and journal entries`,
        t`Banking and reconciliation records`,
        t`Inventory and configuration data`,
      ];
    },
  },
  async activated() {
    docsPathRef.value = 'books/backup';
    await this.loadSummary();
  },
  deactivated() {
    docsPathRef.value = '';
  },
  methods: {
    async loadSummary() {
      this.companyName = String(fyo.singles.AccountingSettings?.companyName ?? '');
      const schemas = Object.values(fyo.schemaMap).filter(
        (schema) => !schema.isChild && !schema.isSingle
      );
      this.schemaCount = schemas.length;
      let count = 0;
      for (const schema of schemas) {
        if (!schema) continue;
        count += await fyo.db.count(schema.name);
      }
      this.recordCount = count;
    },
    async saveBackup() {
      if (this.loading) return;
      this.loading = true;
      try {
        const snapshot = await createBackupSnapshot();
        const data = JSON.stringify(snapshot, null, 2);
        const { canceled, filePath } = await getSavePath(
          getBackupFileName(this.companyName),
          'json'
        );
        if (canceled || !filePath) return;
        await ipc.saveData(data, filePath);
        showExportInFolder(t`Backup Created`, filePath);
        showToast({ type: 'success', message: t`Company backup created successfully.` });
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>
