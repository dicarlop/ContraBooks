<template>
  <div class="flex-1 flex justify-center items-center bg-gray-25 dark:bg-gray-900" :class="{ 'pointer-events-none': loadingDatabase, 'window-drag': platform !== 'Windows' }">
    <div class="w-full w-form shadow-lg rounded-lg border dark:border-gray-800 relative bg-white dark:bg-gray-875" style="height: 700px">
      <div class="px-4 py-4">
        <h1 class="text-2xl font-semibold select-none dark:text-gray-25">{{ t`Welcome to ContraBooks` }}</h1>
        <p class="text-gray-600 dark:text-gray-400 text-base select-none">{{ t`Create a new company or select an existing one from your computer` }}</p>
      </div>
      <hr class="dark:border-gray-800" />
      <div data-testid="create-new-file" class="px-4 h-row-largest flex flex-row items-center gap-4 p-2" :class="creatingDemo ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-890 cursor-pointer'" @click="newDatabase">
        <div class="w-8 h-8 rounded-full bg-blue-500 relative flex-center"><feather-icon name="plus" class="text-white dark:text-gray-900 w-5 h-5" /></div>
        <div><p class="font-medium dark:text-gray-200">{{ t`New Company` }}</p><p class="text-sm text-gray-600 dark:text-gray-400">{{ t`Create a new company and store it on your computer` }}</p></div>
      </div>
      <div class="px-4 h-row-largest flex flex-row items-center gap-4 p-2" :class="creatingDemo ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-890 cursor-pointer'" @click="existingDatabase">
        <div class="w-8 h-8 rounded-full bg-green-500 dark:bg-green-600 relative flex-center"><feather-icon name="upload" class="w-4 h-4 text-white dark:text-gray-900" /></div>
        <div><p class="font-medium dark:text-gray-200">{{ t`Existing Company` }}</p><p class="text-sm text-gray-600 dark:text-gray-400">{{ t`Load an existing company from your computer` }}</p></div>
      </div>
      <div v-if="!files?.length" class="px-4 h-row-largest flex flex-row items-center gap-4 p-2" :class="creatingDemo ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-890 cursor-pointer'" @click="createDemo">
        <div class="w-8 h-8 rounded-full bg-pink-500 dark:bg-pink-600 relative flex-center"><feather-icon name="monitor" class="w-4 h-4 text-white" /></div>
        <div><p class="font-medium dark:text-gray-200">{{ t`Create Canadian Demo` }}</p><p class="text-sm text-gray-600 dark:text-gray-400">{{ t`Create a Canadian company using Canadian dollars` }}</p></div>
      </div>
      <hr class="dark:border-gray-800" />
      <div class="overflow-y-auto" style="max-height: 340px">
        <div v-for="(file, i) in files" :key="file.dbPath" class="h-row-largest px-4 flex gap-4 items-center" :class="creatingDemo ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-890 cursor-pointer'" :title="t`${file.companyName} stored at ${file.dbPath}`" @click="selectFile(file)">
          <div class="w-8 h-8 rounded-full flex justify-center items-center bg-gray-200 dark:bg-gray-800 text-gray-500 font-semibold flex-shrink-0 text-base">{{ i + 1 }}</div>
          <div class="w-full"><div class="flex justify-between overflow-x-auto items-baseline"><h2 class="font-medium dark:text-gray-200">{{ file.companyName }}</h2><p class="whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{{ formatDate(file.modified) }}</p></div><p class="text-sm text-gray-600 dark:text-gray-400 overflow-x-auto no-scrollbar whitespace-nowrap">{{ truncate(file.dbPath) }}</p></div>
          <button class="ms-auto p-2 hover:bg-red-200 dark:hover:bg-red-900 dark:hover:bg-opacity-40 rounded-full w-8 h-8 text-gray-600 dark:text-gray-400 hover:text-red-400 dark:hover:text-red-200" @click.stop="() => deleteDb(i)"><feather-icon name="x" class="w-4 h-4" /></button>
        </div>
      </div>
      <hr v-if="files?.length" class="dark:border-gray-800" />
      <div class="w-full flex justify-between items-center absolute p-4 text-gray-900 dark:text-gray-100" style="top: 100%; transform: translateY(-100%)">
        <LanguageSelector v-show="!creatingDemo" class="text-sm w-28" />
        <button v-if="files?.length" class="text-sm bg-gray-100 dark:bg-gray-890 hover:bg-gray-200 dark:hover:bg-gray-900 rounded px-4 py-1.5 w-auto h-8 no-scrollbar overflow-x-auto whitespace-nowrap" :disabled="creatingDemo" @click="createDemo">{{ creatingDemo ? t`Please Wait` : t`Create Canadian Demo` }}</button>
      </div>
    </div>
    <Loading v-if="creatingDemo" :open="creatingDemo" :show-x="false" :full-width="true" :percent="creationPercent" :message="creationMessage" />
    <Modal :open-modal="openModal" @closemodal="openModal = false">
      <div class="p-4 text-gray-900 dark:text-gray-100 w-form">
        <h2 class="text-xl font-semibold select-none">{{ t`Demo Data Size` }}</h2>
        <p class="text-base mt-2">{{ t`Choose how much sample data to create for the Canadian demo company.` }}</p>
        <div class="flex my-12 justify-center items-baseline gap-4 text-base"><label for="basecount" class="text-gray-600 dark:text-gray-400">{{ t`Base Count` }}</label><input v-model="baseCount" type="number" name="basecount" class="bg-gray-100 dark:bg-gray-875 focus:bg-gray-200 dark:focus:bg-gray-890 rounded-md px-2 py-1 outline-none" /></div>
        <div class="flex justify-between"><Button @click="openModal = false">{{ t`Cancel` }}</Button><Button type="primary" @click="() => { openModal = false; startCanadianDemoSetup(); }">{{ t`Create` }}</Button></div>
      </div>
    </Modal>
  </div>
</template>
<script lang="ts">
import { setupCanadianDemoInstance } from 'dummy/canadianDemo';
import { t } from 'fyo';
import { Verb } from 'fyo/telemetry/types';
import { DateTime } from 'luxon';
import Button from 'src/components/Button.vue';
import LanguageSelector from 'src/components/Controls/LanguageSelector.vue';
import FeatherIcon from 'src/components/FeatherIcon.vue';
import Loading from 'src/components/Loading.vue';
import Modal from 'src/components/Modal.vue';
import { fyo } from 'src/initFyo';
import { showDialog } from 'src/utils/interactive';
import { updateConfigFiles } from 'src/utils/misc';
import { deleteDb, getSavePath, getSelectedFilePath } from 'src/utils/ui';
import type { ConfigFilesWithModified } from 'utils/types';
import { defineComponent } from 'vue';

const LEGACY_DEMO_NAMES = ["Flo's Clothes", 'Demo Company Inc.'];

export default defineComponent({
  name: 'DatabaseSelector',
  components: { LanguageSelector, Loading, FeatherIcon, Modal, Button },
  emits: ['file-selected', 'new-database'],
  data() {
    return { openModal: false, baseCount: 20, creationMessage: '', creationPercent: 0, creatingDemo: false, loadingDatabase: false, files: [] } as {
      openModal: boolean; baseCount: number; creationMessage: string; creationPercent: number; creatingDemo: boolean; loadingDatabase: boolean; files: ConfigFilesWithModified[];
    };
  },
  async mounted() {
    await this.setFiles();
    if (fyo.store.isDevelopment) {
      // @ts-ignore
      window.ds = this;
    }
  },
  methods: {
    truncate(value: string) { return value.length < 72 ? value : '...' + value.slice(value.length - 72); },
    formatDate(isoDate: string) { return DateTime.fromISO(isoDate).toRelative(); },
    async deleteDb(i: number) {
      const file = this.files[i];
      const setFiles = this.setFiles.bind(this);
      await showDialog({ title: t`Delete ${file.companyName}?`, detail: t`Database file: ${file.dbPath}`, type: 'warning', buttons: [
        { label: this.t`Yes`, async action() { await deleteDb(file.dbPath); await setFiles(); }, isPrimary: true },
        { label: this.t`No`, action() { return null; }, isEscape: true },
      ] });
    },
    async createDemo() {
      if (this.creatingDemo) return;
      if (fyo.store.isDevelopment) this.openModal = true;
      else await this.startCanadianDemoSetup();
    },
    async startCanadianDemoSetup() {
      if (this.creatingDemo) return;
      await this.removeLegacyDemos();
      const { filePath, canceled } = await getSavePath('maple-ridge-canada-demo', 'db');
      if (canceled || !filePath) return;
      this.creatingDemo = true;
      try {
        await setupCanadianDemoInstance(filePath, fyo, (message, percent) => { this.creationMessage = message; this.creationPercent = percent; });
        updateConfigFiles(fyo);
        await fyo.purgeCache();
        await this.setFiles();
        this.fyo.telemetry.log(Verb.Created, 'canadian-demo-instance');
        this.$emit('file-selected', filePath);
      } finally {
        this.creatingDemo = false;
      }
    },
    async removeLegacyDemos() {
      const legacyFiles = this.files.filter(({ companyName }) => LEGACY_DEMO_NAMES.includes(companyName));
      for (const file of legacyFiles) await deleteDb(file.dbPath);
      if (legacyFiles.length) await this.setFiles();
    },
    async setFiles() {
      const dbList = await ipc.getDbList();
      this.files = dbList?.sort((a, b) => Date.parse(b.modified) - Date.parse(a.modified));
    },
    newDatabase() { if (!this.creatingDemo) this.$emit('new-database'); },
    async existingDatabase() { if (!this.creatingDemo) this.emitFileSelected((await getSelectedFilePath())?.filePaths?.[0]); },
    selectFile(file: ConfigFilesWithModified) { if (!this.creatingDemo) this.emitFileSelected(file.dbPath); },
    emitFileSelected(filePath: string) { if (filePath) this.$emit('file-selected', filePath); },
  },
});
</script>
