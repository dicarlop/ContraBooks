<template>
  <div class="template-manager">
    <header class="manager-header">
      <div>
        <div class="eyebrow">ContraBooks</div>
        <h1>Templates</h1>
        <p>Manage invoice forms the way a desktop accounting program should: choose a template, customize the fields, preview it, then open the full editor when you need more control.</p>
      </div>
      <button class="secondary-button" type="button" @click="routeTo('/')">Back to Dashboard</button>
    </header>

    <main class="customization-window">
      <section class="left-panel">
        <div class="panel-title-row">
          <div>
            <span class="panel-eyebrow">Selected Template</span>
            <strong>{{ selectedPreset }}</strong>
          </div>
          <button class="small-button" type="button" @click="usePreset(selectedPreset)">Copy</button>
        </div>

        <div class="template-list">
          <button
            v-for="preset in presets"
            :key="preset.name"
            type="button"
            class="template-row"
            :class="selectedPreset === preset.name ? 'selected' : ''"
            @click="selectTemplate(preset.name)"
          >
            <span class="template-swatch" :class="`swatch-${preset.name.toLowerCase()}`"></span>
            <span class="template-row-copy">
              <strong>{{ preset.name }}</strong>
              <small>{{ preset.detail }}</small>
            </span>
            <span v-if="selectedPreset === preset.name" class="selected-mark">✓</span>
          </button>
        </div>

        <div class="section-block">
          <div class="section-heading">Basic Customization</div>
          <label class="check-row"><input v-model="options.useLogo" type="checkbox" /><span>Use company logo</span></label>
          <label class="field-row"><span>Color Scheme</span><select v-model="options.color"><option value="navy">ContraBooks Navy</option><option value="teal">Teal Accent</option><option value="slate">Slate</option></select></label>
          <label class="field-row"><span>Form Font</span><select v-model="options.font"><option value="Inter">Inter</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option></select></label>
          <div class="field-options">
            <label><input v-model="options.companyName" type="checkbox" /> Company Name</label>
            <label><input v-model="options.address" type="checkbox" /> Company Address</label>
            <label><input v-model="options.phone" type="checkbox" /> Phone</label>
            <label><input v-model="options.email" type="checkbox" /> Email</label>
            <label><input v-model="options.pastDue" type="checkbox" /> Past Due Stamp</label>
            <label><input v-model="options.status" type="checkbox" /> Status Stamp</label>
          </div>
        </div>

        <div class="section-block">
          <div class="section-heading">Additional Customization</div>
          <div class="tabs">
            <button v-for="tab in tabs" :key="tab" type="button" :class="activeTab === tab ? 'active' : ''" @click="activeTab = tab">{{ tab }}</button>
          </div>
          <div class="field-table">
            <div class="field-table-head"><span>Field</span><span>Screen</span><span>Print</span><span>Title</span></div>
            <label v-for="field in currentFields" :key="field.key" class="field-table-row">
              <span>{{ field.label }}</span>
              <input v-model="field.screen" type="checkbox" />
              <input v-model="field.print" type="checkbox" />
              <input v-model="field.title" class="title-input" type="text" />
            </label>
          </div>
        </div>
      </section>

      <section class="preview-panel">
        <div class="preview-header">
          <div>
            <span class="panel-eyebrow">Preview</span>
            <strong>{{ selectedPreset }} Invoice</strong>
          </div>
          <span class="preview-status">Live preview</span>
        </div>

        <div class="paper-wrap">
          <article class="invoice-paper" :class="[`paper-${selectedPreset.toLowerCase()}`, `font-${options.font.toLowerCase()}`]">
            <div class="invoice-head" :class="`accent-${options.color}`">
              <div class="company-block">
                <div v-if="options.useLogo" class="logo-placeholder">CB</div>
                <div>
                  <h2 v-if="options.companyName">Maple Ridge Business Solutions Inc.</h2>
                  <p v-if="options.address">250 Saint-Paul Street West · Montreal, Quebec H2Y 2A2</p>
                  <p v-if="options.phone || options.email">{{ options.phone ? '+1 514-555-0147' : '' }}{{ options.phone && options.email ? ' · ' : '' }}{{ options.email ? 'alex@mapleridge.ca' : '' }}</p>
                </div>
              </div>
              <div class="invoice-meta">
                <h3 v-if="field('Default Title')?.print !== false">{{ field('Default Title')?.title || 'INVOICE' }}</h3>
                <span v-if="options.status && field('Default Title')?.print !== false" class="status-pill" :class="{ 'past-due': options.pastDue }">{{ options.pastDue ? 'PAST DUE' : 'OPEN' }}</span>
                <div v-if="field('Invoice Number')?.print !== false"># 10005</div>
                <div v-if="field('Date')?.print !== false">September 16, 2026</div>
              </div>
            </div>

            <div class="bill-row">
              <div v-if="field('Bill To')?.print !== false"><small>{{ field('Bill To')?.title || 'Bill To' }}</small><strong>Northstar Design Studio</strong><span>123 Wellington Street</span><span>Montreal, QC</span></div>
              <div class="due-box"><small>Amount Due</small><strong>$1,250.00</strong></div>
            </div>

            <table>
              <thead><tr>
                <th v-if="field('Description')?.print !== false">{{ field('Description')?.title || 'Description' }}</th>
                <th v-if="field('Quantity')?.print !== false">{{ field('Quantity')?.title || 'Quantity' }}</th>
                <th v-if="field('Rate')?.print !== false">{{ field('Rate')?.title || 'Rate' }}</th>
                <th v-if="field('Amount')?.print !== false">{{ field('Amount')?.title || 'Amount' }}</th>
              </tr></thead>
              <tbody><tr>
                <td v-if="field('Description')?.print !== false">Business Consulting</td>
                <td v-if="field('Quantity')?.print !== false">2</td>
                <td v-if="field('Rate')?.print !== false">$185.00</td>
                <td v-if="field('Amount')?.print !== false">$370.00</td>
              </tr><tr>
                <td v-if="field('Description')?.print !== false">Implementation Services</td>
                <td v-if="field('Quantity')?.print !== false">1</td>
                <td v-if="field('Rate')?.print !== false">$325.00</td>
                <td v-if="field('Amount')?.print !== false">$325.00</td>
              </tr><tr>
                <td v-if="field('Description')?.print !== false">Monthly Support</td>
                <td v-if="field('Quantity')?.print !== false">1</td>
                <td v-if="field('Rate')?.print !== false">$145.00</td>
                <td v-if="field('Amount')?.print !== false">$145.00</td>
              </tr></tbody>
            </table>

            <div class="totals">
              <div v-if="field('Subtotal')?.print !== false"><span>{{ field('Subtotal')?.title || 'Subtotal' }}</span><strong>$840.00</strong></div>
              <div v-if="field('Tax')?.print !== false"><span>{{ field('Tax')?.title || 'Tax' }}</span><strong>$109.20</strong></div>
              <div v-if="field('Payments / Credits')?.print !== false"><span>{{ field('Payments / Credits')?.title || 'Payments / Credits' }}</span><strong>$0.00</strong></div>
              <div v-if="field('Balance Due')?.print !== false || field('Total')?.print !== false" class="grand"><span>{{ field('Balance Due')?.print !== false ? (field('Balance Due')?.title || 'Balance Due') : (field('Total')?.title || 'Total') }}</span><strong>$949.20</strong></div>
            </div>

            <div class="invoice-footer">
              <span v-if="field('Notes')?.print !== false">Thank you for your business.</span>
              <span v-if="field('Terms & Conditions')?.print !== false">CAD · Terms & Conditions</span>
              <span v-if="field('Print Date')?.print !== false">Printed September 16, 2026</span>
              <span v-if="field('Page Numbers')?.print !== false">Page 1 of 1</span>
            </div>
          </article>
        </div>

        <div class="action-bar">
          <button type="button" class="text-button">Help</button>
          <button type="button" class="action-button" @click="openEditor">Basic Customization...</button>
          <button type="button" class="action-button" @click="openEditor">Additional Customization...</button>
          <button type="button" class="action-button" @click="openEditor">Layout Designer...</button>
          <button type="button" class="action-button" @click="openEditor">Print Preview...</button>
          <button type="button" class="primary-button" @click="openEditor">Edit Template</button>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts">
import { ModelNameEnum } from 'models/types';
import { fyo } from 'src/initFyo';
import { routeTo } from 'src/utils/ui';
import { getTemplatePreset, templatePresetNames } from 'src/utils/templatePresets';
import type { TemplatePresetName } from 'src/utils/templatePresets';
import { computed, defineComponent } from 'vue';

interface FieldOption {
  key: string;
  label: string;
  screen: boolean;
  print: boolean;
  title: string;
}

const makeFields = (labels: string[]): FieldOption[] =>
  labels.map((label, index) => ({
    key: `${label}-${index}`,
    label,
    screen: true,
    print: true,
    title: label,
  }));

export default defineComponent({
  name: 'TemplateGallery',
  data() {
    return {
      selectedPreset: 'Professional' as string,
      activeTab: 'Header',
      tabs: ['Header', 'Columns', 'Footer', 'Print'],
      options: {
        useLogo: true,
        color: 'navy',
        font: 'Inter',
        companyName: true,
        address: true,
        phone: true,
        email: true,
        pastDue: false,
        status: true,
      },
      fields: {
        Header: makeFields(['Default Title', 'Date', 'Invoice Number', 'Bill To', 'Ship To', 'P.O. No.', 'Terms', 'Due Date']),
        Columns: makeFields(['Description', 'Quantity', 'Rate', 'Amount']),
        Footer: makeFields(['Subtotal', 'Tax', 'Total', 'Payments / Credits', 'Balance Due']),
        Print: makeFields(['Page Numbers', 'Print Date', 'Notes', 'Terms & Conditions']),
      } as Record<string, FieldOption[]>,
      presets: templatePresetNames.map((name) => ({
        name,
        detail:
          name === 'Professional'
            ? 'Balanced client-facing form'
            : name === 'Simple'
              ? 'Clean and compact'
              : name === 'Modern'
                ? 'Contemporary with teal accents'
                : name === 'Classic'
                  ? 'Traditional accounting form'
                  : 'Blank-friendly custom starting point',
      })),
    };
  },
  async mounted() {
    await this.loadCustomTemplates();
  },
  computed: {
    currentFields(): FieldOption[] {
      return this.fields[this.activeTab] ?? [];
    },
  },
  methods: {
    routeTo,
    field(label: string): FieldOption | undefined {
      return Object.values(this.fields)
        .flat()
        .find((option) => option.label === label);
    },
    async loadCustomTemplates() {
      const templates = (await fyo.db.getAll(ModelNameEnum.PrintTemplate, {
        fields: ['name', 'type', 'isCustom'],
        filters: { isCustom: true, type: ModelNameEnum.SalesInvoice },
      })) as { name: string; type: string; isCustom: boolean }[];

      const customNames = templates
        .map((template) => template.name)
        .filter((name): name is string => typeof name === 'string' && !!name);

      for (const name of customNames) {
        if (this.presets.some((preset) => preset.name === name)) continue;
        this.presets.push({
          name,
          detail: 'Saved custom invoice template',
        });
      }
    },
    async selectTemplate(name: string) {
      this.selectedPreset = name;
      await this.loadCustomizationFromTemplate(name);
    },
    async loadCustomizationFromTemplate(name: string) {
      if (templatePresetNames.includes(name as TemplatePresetName)) return;
      const templateDoc = await fyo.doc.getDoc(ModelNameEnum.PrintTemplate, name);
      const document = new DOMParser().parseFromString(
        (templateDoc.template as string) || '',
        'text/html'
      );
      const visible = (section: string) => {
        const node = document.body.querySelector(
          `[data-cb-section="${section}"]`
        ) as HTMLElement | null;
        return !node || node.style.display !== 'none';
      };
      this.options.useLogo = visible('logo');
      this.options.companyName = visible('companyName');
      this.options.address = visible('address');
      this.options.phone = visible('phone');
      this.options.email = visible('email');
      this.options.status = visible('status');
      const status = document.body.querySelector(
        '[data-cb-section="status"]'
      ) as HTMLElement | null;
      this.options.pastDue = status?.textContent?.trim() === 'PAST DUE';

      const root = document.body.firstElementChild as HTMLElement | null;
      if (root) {
        this.options.font =
          root.style.fontFamily?.replace(/^[\"']|[\"']$/g, '') ||
          this.options.font;
        const accent = root.style.borderColor?.toLowerCase();
        this.options.color =
          accent === '#00afc1'
            ? 'teal'
            : accent === '#657986'
              ? 'slate'
              : 'navy';
      }

      const sectionMap: Record<string, string> = {
        'Default Title': 'title',
        Date: 'date',
        'Invoice Number': 'number',
        'Bill To': 'billTo',
        'Page Numbers': 'pageNumbers',
        'Terms & Conditions': 'terms',
        Subtotal: 'subtotal',
        Tax: 'tax',
        Total: 'balance',
        'Payments / Credits': 'payments',
        'Balance Due': 'balance',
      };
      const columnMap: Record<string, string> = {
        Description: 'item',
        Quantity: 'quantity',
        Rate: 'rate',
        Amount: 'amount',
      };

      for (const field of Object.values(this.fields).flat()) {
        const section = sectionMap[field.label];
        if (section) {
          field.print = visible(section);
          const node = document.body.querySelector(
            `[data-cb-section="${section}"]`
          ) as HTMLElement | null;
          const label = node?.querySelector('span');
          field.title =
            section === 'title' ||
            section === 'number' ||
            section === 'date'
              ? node?.textContent?.trim() || field.title
              : label?.textContent?.trim() || field.title;
          continue;
        }

        const column = columnMap[field.label];
        if (column) {
          const cell = document.body.querySelector(
            `[data-cb-column="${column}"]`
          ) as HTMLElement | null;
          field.print = !cell || cell.style.display !== 'none';
          const header = document.body.querySelector(
            `thead [data-cb-column="${column}"]`
          );
          field.title = header?.textContent?.trim() || field.title;
        }
      }
    },
    async openEditor() {
      await this.usePreset(this.selectedPreset);
    },
    async usePreset(name: string) {
      if (!templatePresetNames.includes(name as TemplatePresetName)) {
        await routeTo(`/template-builder/${name}`);
        return;
      }
      const baseTemplate = templateDoc?.template as string | undefined;
      const template = this.customizeTemplate(
        baseTemplate ?? getTemplatePreset(name as TemplatePresetName)
      );
      const doc = fyo.doc.getNewDoc(ModelNameEnum.PrintTemplate, {
        name: `${name} Invoice`,
        type: ModelNameEnum.SalesInvoice,
        template,
        isCustom: true,
      });
      await routeTo(`/template-builder/${doc.name!}`);
    },
    customizeTemplate(template: string): string {
      const document = new DOMParser().parseFromString(template, 'text/html');
      const sectionMap: Record<string, boolean> = {
        logo: this.options.useLogo,
        companyName: this.options.companyName,
        address: this.options.address,
        phone: this.options.phone,
        email: this.options.email,
      };

      for (const [section, visible] of Object.entries(sectionMap)) {
        const node = document.body.querySelector(
          `[data-cb-section="${section}"]`
        ) as HTMLElement | null;
        if (node) node.style.display = visible ? '' : 'none';
      }

      const root = document.body.firstElementChild as HTMLElement | null;
      if (root) {
        root.style.fontFamily = this.options.font;
        const accent =
          this.options.color === 'teal'
            ? '#00AFC1'
            : this.options.color === 'slate'
              ? '#657986'
              : '#07345C';
        root.style.borderColor = accent;
      }

      const fields = Object.values(this.fields).flat();
      const sectionLabels: Record<string, string> = {
        'Default Title': 'title',
        'Date': 'date',
        'Invoice Number': 'number',
        'Bill To': 'billTo',
        'Page Numbers': 'pageNumbers',
        'Terms & Conditions': 'terms',
        Subtotal: 'subtotal',
        Tax: 'tax',
        Total: 'balance',
        'Payments / Credits': 'payments',
        'Balance Due': 'balance',
      };
      const columnMap: Record<string, string> = {
        Description: 'item',
        Quantity: 'quantity',
        Rate: 'rate',
        Amount: 'amount',
      };

      for (const field of fields) {
        const section = sectionLabels[field.label];
        if (section) {
          const node = document.body.querySelector(
            `[data-cb-section="${section}"]`
          ) as HTMLElement | null;
          if (!node) continue;

          node.style.display = field.print ? '' : 'none';

          if (section === 'title' || section === 'number' || section === 'date') {
            const text = node.firstChild;
            if (text && field.title.trim()) text.textContent = field.title;
          } else if (section === 'billTo') {
            const label = node.querySelector('div');
            if (label && field.title.trim()) label.textContent = field.title;
          } else if (
            section === 'subtotal' ||
            section === 'tax' ||
            section === 'payments' ||
            section === 'balance'
          ) {
            const label = node.querySelector('span');
            if (label && field.title.trim()) label.textContent = field.title;
          }
          continue;
        }

        const column = columnMap[field.label];
        if (column) {
          const cells = document.body.querySelectorAll(
            `[data-cb-column="${column}"]`
          );
          cells.forEach((cell) => {
            (cell as HTMLElement).style.display = field.print ? '' : 'none';
          });
          const header = document.body.querySelector(
            `thead [data-cb-column="${column}"]`
          );
          if (header && field.title.trim()) header.textContent = field.title;
        }

      }

      if (!this.options.status) {
        const status = document.body.querySelector('[data-cb-section="status"]');
        status?.remove();
      }

      if (this.options.pastDue) {
        const status = document.body.querySelector(
          '[data-cb-section="status"]'
        ) as HTMLElement | null;
        if (status) {
          status.textContent = 'PAST DUE';
          status.style.background = '#FFF1F2';
          status.style.color = '#B42318';
        }
      }

      return document.body.innerHTML;
    },
  },
});
</script>

<style scoped>
.template-manager{height:100%;overflow:auto;background:#eef3f7;color:#14202B;padding:28px 32px;box-sizing:border-box}.manager-header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;max-width:1280px;margin:0 auto 18px}.eyebrow,.panel-eyebrow{text-transform:uppercase;letter-spacing:1.2px;color:#6b879d;font-size:10px;font-weight:800}.manager-header h1{margin:4px 0 5px;color:#07345C;font-size:25px;letter-spacing:-.4px}.manager-header p{max-width:850px;margin:0;color:#60798e;font-size:12px;line-height:1.5}.secondary-button,.small-button,.action-button,.text-button,.primary-button{height:32px;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer}.secondary-button,.small-button,.action-button{border:1px solid #bfcdd7;background:#f8fafc;color:#254963}.secondary-button:hover,.small-button:hover,.action-button:hover{background:#fff;border-color:#7aa7bd}.customization-window{display:grid;grid-template-columns:430px minmax(560px,1fr);max-width:1280px;min-height:680px;margin:0 auto;background:#fff;border:1px solid #aebdca;box-shadow:0 8px 26px rgba(7,52,92,.08)}.left-panel{border-right:1px solid #bfcdd7;overflow:auto}.panel-title-row{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:linear-gradient(#f8fafb,#edf2f5);border-bottom:1px solid #c5d1d9}.panel-title-row strong{display:block;margin-top:3px;color:#193f5d;font-size:13px}.small-button{height:27px;padding:0 11px}.template-list{padding:8px;border-bottom:1px solid #d7e0e6}.template-row{display:flex;align-items:center;width:100%;min-height:52px;padding:7px 8px;border:1px solid transparent;background:#fff;text-align:left;cursor:pointer}.template-row:hover{background:#f3f8fb}.template-row.selected{background:#e7f6f9;border-color:#a9dce5}.template-swatch{width:26px;height:34px;margin-right:10px;border:1px solid #c4d0d8;background:#fff;box-shadow:inset 0 4px #07345C}.swatch-simple{box-shadow:none}.swatch-modern{border-radius:5px;box-shadow:inset 0 4px #18C6D3}.swatch-classic{box-shadow:inset 0 4px #586874}.swatch-custom{border:2px dashed #18C6D3}.template-row-copy{display:flex;flex-direction:column;gap:2px;min-width:0}.template-row-copy strong{font-size:12px;color:#173c59}.template-row-copy small{font-size:10px;color:#72899a}.selected-mark{margin-left:auto;color:#008e9f;font-weight:800}.section-block{padding:13px 15px;border-bottom:1px solid #d7e0e6}.section-heading{margin-bottom:9px;color:#294f6a;font-size:12px;font-weight:800}.check-row,.field-row{display:flex;align-items:center;min-height:29px;font-size:11px;color:#36566b}.check-row input,.field-options input,.field-table input{accent-color:#00AFC1}.field-row{justify-content:space-between;gap:12px}.field-row select{width:205px;height:27px;border:1px solid #bfcdd7;background:#fff;border-radius:3px;padding:0 7px;color:#274960;font-size:11px}.field-options{display:grid;grid-template-columns:1fr 1fr;gap:7px 12px;margin-top:8px;color:#526d7f;font-size:10px}.tabs{display:flex;border-bottom:1px solid #cbd6dd;margin:0 -15px;padding:0 15px}.tabs button{border:0;border-bottom:2px solid transparent;background:transparent;padding:7px 8px 6px;color:#6a8090;font-size:10px;font-weight:700;cursor:pointer}.tabs button.active{color:#07345C;border-bottom-color:#00AFC1}.field-table{margin-top:8px;border:1px solid #d0dbe2}.field-table-head,.field-table-row{display:grid;grid-template-columns:minmax(105px,1fr) 38px 38px 100px;align-items:center;min-height:29px;padding:0 7px;gap:5px;font-size:9px}.field-table-head{background:#f0f4f6;color:#688092;font-weight:800}.field-table-row{border-top:1px solid #e4eaee;color:#3e5d70}.field-table-row input[type=checkbox]{justify-self:center}.title-input{width:100%;height:22px;border:1px solid #c6d2da;padding:0 4px;font-size:9px}.preview-panel{display:flex;flex-direction:column;min-width:0;background:#e7edf2}.preview-header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:linear-gradient(#f8fafb,#edf2f5);border-bottom:1px solid #c5d1d9}.preview-header strong{display:block;margin-top:3px;color:#193f5d;font-size:13px}.preview-status{font-size:10px;color:#5e7d8f}.paper-wrap{flex:1;overflow:auto;padding:24px;display:flex;justify-content:center}.invoice-paper{width:min(690px,100%);min-height:760px;padding:34px;background:#fff;border:1px solid #bdc9d1;box-shadow:0 5px 18px rgba(0,0,0,.08);box-sizing:border-box;font-size:10px;color:#334b5b}.font-arial{font-family:Arial,sans-serif}.font-georgia{font-family:Georgia,serif}.invoice-head{display:flex;justify-content:space-between;gap:25px;padding-bottom:20px;border-bottom:2px solid #d8e1e7}.invoice-head.accent-teal{border-bottom-color:#00AFC1}.invoice-head.accent-slate{border-bottom-color:#657986}.paper-professional .invoice-head{border-top:6px solid #07345C;padding-top:14px}.paper-modern{border-radius:10px}.paper-modern .invoice-head{border-bottom:3px solid #18C6D3}.paper-classic{font-family:Georgia,serif}.paper-classic .invoice-head{border-bottom:1px solid #697b86}.paper-custom{border:2px dashed #18C6D3}.company-block{display:flex;gap:10px;align-items:flex-start}.logo-placeholder{width:40px;height:40px;display:grid;place-items:center;border-radius:4px;background:#07345C;color:#fff;font-weight:800;font-size:13px}.company-block h2{margin:0;color:#07345C;font-size:19px}.company-block p{margin:4px 0 0;color:#687f90;font-size:9px}.invoice-meta{text-align:right}.invoice-meta h3{margin:0;color:#07345C;font-size:24px;letter-spacing:.4px}.invoice-meta div{margin-top:4px;color:#718595;font-size:9px}.status-pill{display:inline-block;margin:5px 0 2px;padding:2px 7px;border-radius:10px;background:#e8f8f2;color:#087c58;font-size:8px;font-weight:800}.status-pill.past-due{background:#fff1f2;color:#b42318}.bill-row{display:flex;justify-content:space-between;gap:30px;padding:22px 0}.bill-row small,.due-box small{display:block;text-transform:uppercase;letter-spacing:.8px;color:#7890a0;font-size:8px}.bill-row strong{display:block;margin-top:5px;color:#173f5e;font-size:11px}.bill-row span{display:block;margin-top:2px;color:#718595;font-size:9px}.due-box{text-align:right}.due-box strong{font-size:18px}.invoice-paper table{width:100%;border-collapse:collapse;font-size:9px}.invoice-paper th{padding:8px 6px;text-align:left;background:#edf3f6;color:#4a687d;border-bottom:1px solid #cbd7de}.invoice-paper th:not(:first-child),.invoice-paper td:not(:first-child){text-align:right}.invoice-paper td{padding:9px 6px;border-bottom:1px solid #e4eaee}.totals{width:230px;margin:20px 0 0 auto;font-size:9px}.totals div{display:flex;justify-content:space-between;padding:6px 0}.totals .grand{margin-top:3px;padding-top:9px;border-top:2px solid #00AFC1;color:#07345C;font-size:12px}.invoice-footer{display:flex;justify-content:space-between;margin-top:36px;padding-top:12px;border-top:1px solid #e4eaee;color:#8094a1;font-size:8px}.action-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:9px 10px;border-top:1px solid #bccbd4;background:linear-gradient(#f7fafb,#e9eef2)}.text-button{padding:0 9px;border:0;background:transparent;color:#5e7586}.action-button{padding:0 9px}.primary-button{padding:0 14px;border:1px solid #006f9c;background:#007fb1;color:#fff;margin-left:auto}.primary-button:hover{background:#006e99}@media(max-width:1050px){.customization-window{grid-template-columns:370px 1fr}.field-table-head,.field-table-row{grid-template-columns:minmax(90px,1fr) 32px 32px 82px}}@media(max-width:820px){.template-manager{padding:16px}.manager-header{flex-direction:column}.customization-window{grid-template-columns:1fr}.preview-panel{min-height:720px}.left-panel{border-right:0;border-bottom:1px solid #bfcdd7}}
</style>
