<template>
  <div class="visual-designer">
    <div class="designer-toolbar">
      <div class="toolbar-group">
        <label>Element</label>
        <select v-model="selectedId" @change="selectElement">
          <option value="">Select an element…</option>
          <option v-for="element in elements" :key="element.id" :value="element.id">
            {{ element.label }}
          </option>
        </select>
      </div>
      <div class="toolbar-group">
        <label>Text</label>
        <input v-model="textValue" :disabled="!selectedId || !canEditText" placeholder="Label or heading" @change="applyText" />
      </div>
      <div class="toolbar-group compact">
        <label>Size</label>
        <select v-model="fontSize" :disabled="!selectedId" @change="applyStyle('font-size', fontSize)">
          <option value="10px">10</option><option value="12px">12</option><option value="14px">14</option><option value="16px">16</option><option value="18px">18</option><option value="20px">20</option><option value="24px">24</option><option value="28px">28</option><option value="32px">32</option>
        </select>
      </div>
      <div class="toolbar-group compact"><label>Text Color</label><input type="color" v-model="textColor" :disabled="!selectedId" @change="applyStyle('color', textColor)" /></div>
      <div class="toolbar-group compact"><label>Fill</label><input type="color" v-model="backgroundColor" :disabled="!selectedId" @change="applyStyle('background-color', backgroundColor)" /></div>
      <div class="toolbar-group compact"><label>Align</label><select v-model="textAlign" :disabled="!selectedId" @change="applyStyle('text-align', textAlign)"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div>
      <div class="toolbar-group move"><label>Move</label><div><button type="button" :disabled="!selectedId" title="Move up" @click="moveElement(-1)">↑</button><button type="button" :disabled="!selectedId" title="Move down" @click="moveElement(1)">↓</button><button type="button" :disabled="!selectedId" title="Move left" @click="nudge(-1)">←</button><button type="button" :disabled="!selectedId" title="Move right" @click="nudge(1)">→</button></div></div>
      <button type="button" class="logo-button" @click="$emit('insert-logo')">＋ Insert Logo</button>
    </div>
    <div class="designer-help">Click an element in the preview to select it, then use the controls above. Changes are saved into the template — no HTML required.</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

type VisualElement = { id: string; label: string; tag: string; text: string; style: CSSStyleDeclaration };

export default defineComponent({
  name: 'TemplateVisualDesigner',
  props: { template: { type: String, required: true }, selectedElementId: { type: String, default: '' } },
  emits: ['update:template', 'insert-logo', 'select'],
  data() { return { selectedId: this.selectedElementId, fontSize: '14px', textColor: '#14202B', backgroundColor: '#FFFFFF', textAlign: 'left', textValue: '' } as { selectedId: string; fontSize: string; textColor: string; backgroundColor: string; textAlign: string; textValue: string }; },
  computed: {
    elements(): VisualElement[] {
      const doc = new DOMParser().parseFromString(this.template, 'text/html');
      return Array.from(doc.body.querySelectorAll('*')).filter((el) => el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE').map((el, index) => {
        const htmlElement = el as HTMLElement;
        const id = htmlElement.getAttribute('data-cb-id') ?? `cb-${index}`;
        if (!htmlElement.getAttribute('data-cb-id')) htmlElement.setAttribute('data-cb-id', id);
        const text = (htmlElement.textContent ?? '').trim().replace(/\s+/g, ' ');
        return { id, label: `${htmlElement.tagName.toLowerCase()}${text ? ` — ${text.slice(0, 48)}` : ''}`, tag: htmlElement.tagName.toLowerCase(), text, style: htmlElement.style };
      });
    },
    canEditText(): boolean { const el = this.findElement(); return !!el && !el.innerHTML.includes('{{'); },
  },
  watch: { selectedElementId(value: string) { this.selectedId = value; this.syncControls(); }, template() { this.syncControls(); } },
  mounted() { this.syncControls(); },
  methods: {
    sourceDocument(): Document { return new DOMParser().parseFromString(this.template, 'text/html'); },
    findElement(): HTMLElement | null { return this.sourceDocument().body.querySelector(`[data-cb-id="${CSS.escape(this.selectedId)}"]`) as HTMLElement | null; },
    selectElement() { this.syncControls(); this.$emit('select', this.selectedId); },
    syncControls() {
      const el = this.findElement();
      if (!el) return;
      this.textValue = el.textContent?.trim() ?? '';
      this.fontSize = el.style.fontSize || '14px';
      this.textColor = el.style.color || '#14202B';
      this.backgroundColor = el.style.backgroundColor || '#FFFFFF';
      this.textAlign = el.style.textAlign || 'left';
    },
    emitDocument(doc: Document) { this.$emit('update:template', doc.body.innerHTML); },
    withSelected(mutator: (el: HTMLElement) => void) {
      if (!this.selectedId) return;
      const doc = this.sourceDocument();
      const el = doc.body.querySelector(`[data-cb-id="${CSS.escape(this.selectedId)}"]`) as HTMLElement | null;
      if (!el) return;
      mutator(el); this.emitDocument(doc);
    },
    applyStyle(property: string, value: string) { this.withSelected((el) => el.style.setProperty(property, value)); },
    applyText() { if (!this.canEditText) return; this.withSelected((el) => { el.textContent = this.textValue; }); },
    moveElement(direction: number) {
      this.withSelected((el) => { const sibling = direction < 0 ? el.previousElementSibling : el.nextElementSibling; if (!sibling || sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE') return; if (direction < 0) sibling.before(el); else sibling.after(el); });
    },
    nudge(direction: number) { this.withSelected((el) => { const current = parseInt(el.style.marginLeft || '0', 10) || 0; el.style.marginLeft = `${current + direction * 8}px`; }); },
  },
});
</script>

<style scoped>
.visual-designer{background:#fff;border-bottom:1px solid #DCE7EF}.designer-toolbar{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px;padding:10px}.toolbar-group{display:flex;flex-direction:column;gap:3px}.toolbar-group label{font-size:9px;font-weight:700;color:#64748B;text-transform:uppercase}.toolbar-group select,.toolbar-group input[type=text],.toolbar-group input:not([type]){height:30px;min-width:105px;border:1px solid #DCE7EF;border-radius:6px;padding:0 7px;font-size:11px;color:#173B59;background:#fff}.toolbar-group input[type=color]{width:34px;height:30px;padding:2px;border:1px solid #DCE7EF;border-radius:6px}.compact select{min-width:65px}.move div{display:flex;gap:2px}.move button{width:29px;height:30px;border:1px solid #DCE7EF;border-radius:5px;background:#fff;color:#07345C}.move button:disabled{opacity:.4}.logo-button{height:30px;border:0;border-radius:6px;padding:0 10px;background:#00AFC1;color:#fff;font-size:11px;font-weight:700}.designer-help{padding:0 10px 9px;color:#7B9AB4;font-size:10px}
</style>
