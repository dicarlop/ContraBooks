<template>
  <div class="flex flex-col flex-1 bg-gray-25 dark:bg-gray-875">
    <PageHeader :border="true" :title="t`Print View`">
      <AutoComplete
        v-if="templateList.length"
        :df="{
          fieldtype: 'AutoComplete',
          fieldname: 'templateName',
          label: t`Template Name`,
          options: templateList.map((n) => ({ label: n, value: n })),
        }"
        input-class="text-base py-0 h-8"
        class="w-40"
        :border="true"
        :value="templateName ?? ''"
        @change="onTemplateNameChange"
      />
      <DropdownWithActions :actions="actions" :title="t`More`" />
      <Button
        v-if="emailContext"
        class="text-xs"
        type="primary"
        @click="emailOpen = true"
      >
        {{ t`Email` }}
      </Button>
      <Button class="text-xs" type="primary" @click="savePDF()">
        {{ t`Save as PDF` }}
      </Button>
      <Button class="text-xs" type="primary" @click="savePDF(true)">
        {{ t`Print` }}
      </Button>
    </PageHeader>

    <div class="overflow-auto custom-scroll custom-scroll-thumb1 p-4">
      <div
        v-if="helperMessage"
        class="text-sm text-gray-700 dark:text-gray-300"
      >
        {{ helperMessage }}
      </div>

      <PrintContainer
        v-if="printProps"
        ref="printContainer"
        :print-schema-name="schemaName"
        :template="printProps.template"
        :values="printProps.values"
        :scale="scale"
        :width="templateDoc?.width"
        :height="templateDoc?.height"
      />
    </div>

    <EmailDocumentModal
      v-if="emailContext"
      :open="emailOpen"
      :context="emailContext"
      :initial-to="emailInitialTo"
      :sending="emailSending"
      @close="emailOpen = false"
      @send="sendEmail"
    />
  </div>
</template>
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import { Action } from 'fyo/model/types';
import { PrintTemplate } from 'models/baseModels/PrintTemplate';
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import AutoComplete from 'src/components/Controls/AutoComplete.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import EmailDocumentModal from 'src/components/EmailDocumentModal.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { handleErrorWithDialog } from 'src/errorHandling';
import { fyo } from 'src/initFyo';
import { getPrintTemplatePropValues } from 'src/utils/printTemplates';
import { showToast } from 'src/utils/interactive';
import type { DocumentEmailContext } from 'src/utils/email';
import { showSidebar } from 'src/utils/refs';
import { PrintValues } from 'src/utils/types';
import { getFormRoute, openSettings, routeTo } from 'src/utils/ui';
import { defineComponent } from 'vue';
import PrintContainer from '../TemplateBuilder/PrintContainer.vue';

export default defineComponent({
  name: 'PrintView',
  components: {
    PageHeader,
    Button,
    AutoComplete,
    PrintContainer,
    DropdownWithActions,
    EmailDocumentModal,
  },
  props: {
    schemaName: { type: String, required: true },
    name: { type: String, required: true },
  },
  data() {
    return {
      doc: null,
      scale: 1,
      values: null,
      templateDoc: null,
      templateName: null,
      templateList: [],
      emailOpen: false,
      emailSending: false,
    } as {
      doc: null | Doc;
      scale: number;
      values: null | PrintValues;
      templateDoc: null | PrintTemplate;
      templateName: null | string;
      templateList: string[];
      emailOpen: boolean;
      emailSending: boolean;
    };
  },
  computed: {
    helperMessage() {
      if (!this.templateList.length) {
        const label =
          this.fyo.schemaMap[this.schemaName]?.label ?? this.schemaName;

        return this.t`No Print Templates not found for entry type ${label}`;
      }

      if (!this.templateDoc) {
        return this.t`Please select a Print Template`;
      }

      return '';
    },
    printProps(): null | { template: string; values: PrintValues } {
      const values = this.values;
      if (!values) {
        return null;
      }

      const template = this.templateDoc?.template;
      if (!template) {
        return null;
      }

      return { values, template };
    },
    emailContext(): DocumentEmailContext | null {
      if (!this.doc || !this.values) {
        return null;
      }

      const documentTypeMap: Record<string, DocumentEmailContext['documentType']> = {
        SalesInvoice: 'Invoice',
        PurchaseInvoice: 'Invoice',
        Quote: 'Quote',
        Payment: 'Receipt',
        Receipt: 'Receipt',
        Statement: 'Statement',
        CreditNote: 'Credit Note',
      };

      const party = this.values.doc.links?.party as
        | Record<string, unknown>
        | undefined;
      const customerName =
        this.values.doc.customerName ?? party?.name ?? this.doc.party;

      return {
        documentType: documentTypeMap[this.schemaName] ?? 'Invoice',
        documentNumber: this.doc.name ?? this.name,
        customerName: typeof customerName === 'string' ? customerName : undefined,
        companyName:
          typeof this.values.print.companyName === 'string'
            ? this.values.print.companyName
            : undefined,
        amountDue:
          typeof this.values.doc.outstandingAmount === 'string'
            ? this.values.doc.outstandingAmount
            : undefined,
        dueDate:
          typeof this.values.doc.dueDate === 'string'
            ? this.values.doc.dueDate
            : undefined,
      };
    },
    emailInitialTo(): string {
      if (!this.values) {
        return '';
      }

      const party = this.values.doc.links?.party as
        | Record<string, unknown>
        | undefined;
      const email = party?.email ?? this.values.doc.email ?? this.doc?.email;
      return typeof email === 'string' ? email : '';
    },
    actions(): Action[] {
      const actions = [
        {
          label: this.t`Print Settings`,
          group: this.t`View`,
          async action() {
            await openSettings(ModelNameEnum.PrintSettings);
          },
        },
        {
          label: this.t`New Template`,
          group: this.t`Create`,
          action: async () => {
            const doc = this.fyo.doc.getNewDoc(ModelNameEnum.PrintTemplate, {
              type: this.schemaName,
            });

            const route = getFormRoute(doc.schemaName, doc.name!);
            await routeTo(route);
          },
        },
      ];

      const templateDocName = this.templateDoc?.name;
      if (templateDocName) {
        actions.push({
          label: templateDocName,
          group: this.t`View`,
          action: async () => {
            const route = getFormRoute(
              ModelNameEnum.PrintTemplate,
              templateDocName
            );
            await routeTo(route);
          },
        });

        actions.push({
          label: this.t`Duplicate Template`,
          group: this.t`Create`,
          action: async () => {
            const doc = this.fyo.doc.getNewDoc(ModelNameEnum.PrintTemplate, {
              type: this.schemaName,
              template: this.templateDoc?.template,
            });

            const route = getFormRoute(doc.schemaName, doc.name!);
            await routeTo(route);
          },
        });
      }

      return actions;
    },
  },
  async mounted() {
    await this.initialize();
    if (fyo.store.isDevelopment) {
      // @ts-ignore
      window.pv = this;
    }
  },
  async activated() {
    await this.initialize();
  },
  unmounted() {
    this.reset();
  },
  deactivated() {
    this.reset();
  },
  methods: {
    async initialize() {
      this.doc = await fyo.doc.getDoc(this.schemaName, this.name);
      await this.setTemplateList();
      await this.setTemplateFromDefault();
      if (!this.templateDoc && this.templateList.length) {
        await this.onTemplateNameChange(this.templateList[0]);
      }

      if (this.doc) {
        this.values = await getPrintTemplatePropValues(this.doc as Doc);
      }
    },
    setScale() {
      this.scale = 1;
      const width = (this.templateDoc?.width ?? 21) * 37.8;
      let containerWidth = window.innerWidth - 32;
      if (showSidebar.value) {
        containerWidth -= 12 * 16;
      }

      this.scale = Math.min(containerWidth / width, 1);
    },
    reset() {
      this.doc = null;
      this.values = null;
      this.templateList = [];
      this.templateDoc = null;
      this.scale = 1;
      this.emailOpen = false;
      this.emailSending = false;
    },
    async onTemplateNameChange(value: string | null): Promise<void> {
      if (!value) {
        this.templateDoc = null;
        return;
      }

      this.templateName = value;
      try {
        this.templateDoc = (await this.fyo.doc.getDoc(
          ModelNameEnum.PrintTemplate,
          this.templateName
        )) as PrintTemplate;
      } catch (error) {
        await handleErrorWithDialog(error);
      }
      this.setScale();
    },
    async setTemplateList(): Promise<void> {
      const list = (await this.fyo.db.getAllRaw(ModelNameEnum.PrintTemplate, {
        filters: { type: this.schemaName },
      })) as { name: string }[];

      this.templateList = list.map(({ name }) => name);
    },
    async savePDF(shouldPrint?: boolean) {
      const printContainer = this.$refs.printContainer as {
        savePDF: (name?: string, shouldPrint?: boolean) => Promise<void>;
      };

      if (!printContainer?.savePDF) {
        return;
      }

      await printContainer.savePDF(this.doc?.name, shouldPrint);
    },
    async sendEmail(message: Parameters<typeof ipc.sendDocumentEmail>[0]) {
      const printContainer = this.$refs.printContainer as {
        getPDF: () => Promise<Uint8Array | null>;
      };

      if (!printContainer?.getPDF) {
        return;
      }

      this.emailSending = true;
      try {
        const pdf = await printContainer.getPDF();
        if (!pdf) {
          throw new Error(this.t`Unable to generate the PDF attachment`);
        }

        await ipc.sendDocumentEmail({
          ...message,
          attachments: [
            {
              filename: `${this.doc?.name ?? this.name}.pdf`,
              content: pdf,
              contentType: 'application/pdf',
            },
          ],
        });
        this.emailOpen = false;
        showToast({ message: this.t`Email sent successfully`, type: 'success' });
      } catch (error) {
        await handleErrorWithDialog(error, this.doc ?? undefined);
      } finally {
        this.emailSending = false;
      }
    },
    async setTemplateFromDefault() {
      const defaultName =
        this.schemaName[0].toLowerCase() +
        this.schemaName.slice(1) +
        ModelNameEnum.PrintTemplate;

      let templateName;

      if (
        this.schemaName == ModelNameEnum.SalesInvoice &&
        (this.doc as Doc).isPOS
      ) {
        templateName = this.fyo.singles.Defaults?.posPrintTemplate;

        const posProfileName = this.fyo.singles.POSSettings
          ?.posProfile as string;

        if (posProfileName) {
          const posProfile = await this.fyo.doc.getDoc(
            ModelNameEnum.POSProfile,
            posProfileName
          );

          if (posProfile.posPrintTemplate) {
            templateName = posProfile.posPrintTemplate;
          }
        }
      } else {
        templateName = this.fyo.singles.Defaults?.get(defaultName);
      }

      if (typeof templateName !== 'string') {
        return;
      }

      await this.onTemplateNameChange(templateName);
    },
  },
});
</script>
