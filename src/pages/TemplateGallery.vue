<template>
  <div class="template-gallery">
    <div class="gallery-header">
      <div>
        <div class="eyebrow">ContraBooks</div>
        <h1>Template Builder</h1>
        <p>Start with a professional sample, then make it yours in the full template editor.</p>
      </div>
      <button class="close-button" type="button" @click="routeTo('/')">Back to Dashboard</button>
    </div>

    <div class="gallery-section">
      <div class="section-title">
        <div><h2>Choose a design</h2><p>Every sample is fully editable after you open it.</p></div>
      </div>
      <div class="preset-grid">
        <button v-for="preset in presets" :key="preset.name" class="preset-card" type="button" @click="usePreset(preset.name)">
          <div class="preset-preview" :class="`preview-${preset.name.toLowerCase()}`">
            <div class="preview-top"><span></span><b>{{ preset.name }}</b></div>
            <div class="preview-line wide"></div><div class="preview-line"></div>
            <div class="preview-table"><i></i><i></i><i></i><i></i></div>
            <div class="preview-total"></div>
          </div>
          <div class="preset-copy"><strong>{{ preset.name }}</strong><span>{{ preset.detail }}</span></div>
          <span class="use-link">Use this design →</span>
        </button>
      </div>
    </div>

    <div class="gallery-footer">
      <span class="footer-icon">✦</span>
      <div><strong>Custom means custom.</strong><span>Open any sample in the builder to change layout, colors, typography, fields and content.</span></div>
    </div>
  </div>
</template>

<script lang="ts">
import { ModelNameEnum } from 'models/types';
import { fyo } from 'src/initFyo';
import { routeTo } from 'src/utils/ui';
import { getTemplatePreset, templatePresetNames, TemplatePresetName } from 'src/utils/templatePresets';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TemplateGallery',
  data() {
    return {
      presets: templatePresetNames.map((name) => ({
        name,
        detail: name === 'Professional'
          ? 'Balanced and polished for client-facing invoices.'
          : name === 'Simple'
            ? 'Clean, compact and easy to scan.'
            : name === 'Modern'
              ? 'Contemporary cards, spacing and teal accents.'
              : name === 'Classic'
                ? 'Traditional typography and formal structure.'
                : 'A blank-friendly starting point for your own design.',
      })),
    };
  },
  methods: {
    routeTo,
    async usePreset(name: TemplatePresetName) {
      const doc = fyo.doc.getNewDoc(ModelNameEnum.PrintTemplate, {
        name: `${name} Invoice`,
        type: ModelNameEnum.SalesInvoice,
        template: getTemplatePreset(name),
        isCustom: true,
      });
      await routeTo(`/template-builder/${doc.name!}`);
    },
  },
});
</script>

<style scoped>
.template-gallery{height:100%;overflow:auto;background:#F5F9FC;color:#14202B;padding:34px 40px;box-sizing:border-box}.gallery-header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;max-width:1180px;margin:0 auto 28px}.eyebrow{text-transform:uppercase;letter-spacing:1.6px;color:#00AFC1;font-size:11px;font-weight:800}.gallery-header h1{margin:5px 0 6px;color:#07345C;font-size:30px;letter-spacing:-.6px}.gallery-header p{margin:0;color:#64748B;font-size:13px}.close-button{height:36px;padding:0 14px;border:1px solid #DCE7EF;border-radius:8px;background:#fff;color:#07345C;font-size:12px;font-weight:600;cursor:pointer}.close-button:hover{border-color:#00AFC1;background:#E8FAFC}.gallery-section{max-width:1180px;margin:0 auto}.section-title{margin-bottom:14px}.section-title h2{margin:0;color:#07345C;font-size:18px}.section-title p{margin:4px 0 0;color:#7B9AB4;font-size:11px}.preset-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}.preset-card{min-width:0;padding:0;text-align:left;border:1px solid #DCE7EF;border-radius:12px;background:#fff;overflow:hidden;cursor:pointer;box-shadow:0 3px 13px rgba(7,52,92,.045);transition:transform .14s ease,box-shadow .14s ease,border-color .14s ease}.preset-card:hover{transform:translateY(-2px);border-color:#9FD9E6;box-shadow:0 8px 24px rgba(7,52,92,.1)}.preset-preview{height:210px;margin:12px;border:1px solid #DCE7EF;border-radius:7px;background:#fff;padding:14px;box-sizing:border-box}.preview-professional{border-top:6px solid #07345C}.preview-modern{border-radius:13px;box-shadow:0 4px 12px rgba(7,52,92,.08)}.preview-classic{font-family:Georgia,serif;border-color:#AEBFCA}.preview-custom{border:2px dashed #18C6D3}.preview-top{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid #EAF0F5}.preview-top span{width:58px;height:9px;border-radius:2px;background:#07345C}.preview-top b{font-size:11px;color:#07345C}.preview-simple .preview-top b{font-weight:600;color:#14202B}.preview-modern .preview-top b{color:#00AFC1}.preview-classic .preview-top b{font-family:Georgia,serif}.preview-line{height:5px;width:62%;margin-top:9px;border-radius:3px;background:#EAF0F5}.preview-line.wide{width:82%;margin-top:14px;background:#DCE7EF}.preview-table{display:flex;flex-direction:column;gap:5px;margin-top:18px}.preview-table i{display:block;height:7px;border-radius:2px;background:#F0F5F8}.preview-table i:nth-child(2){width:88%}.preview-table i:nth-child(3){width:94%}.preview-table i:nth-child(4){width:76%}.preview-total{width:45%;height:16px;margin:16px 0 0 auto;border-top:2px solid #00AFC1}.preset-copy{padding:0 14px}.preset-copy strong{display:block;color:#07345C;font-size:14px}.preset-copy span{display:block;min-height:32px;margin-top:4px;color:#7B9AB4;font-size:10px;line-height:1.45}.use-link{display:block;padding:12px 14px;color:#0072CE;font-size:10px;font-weight:700;border-top:1px solid #EAF0F5}.gallery-footer{max-width:1180px;margin:24px auto 0;display:flex;align-items:center;gap:10px;padding:14px 16px;border:1px solid #CDE7EF;border-radius:10px;background:#E8FAFC;color:#07345C}.footer-icon{width:28px;height:28px;display:grid;place-items:center;border-radius:50%;background:#00AFC1;color:#fff}.gallery-footer div{display:flex;flex-direction:column;gap:2px}.gallery-footer strong{font-size:11px}.gallery-footer span{font-size:10px;color:#4E7A8E}@media(max-width:1050px){.preset-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:700px){.template-gallery{padding:20px}.gallery-header{flex-direction:column}.preset-grid{grid-template-columns:1fr 1fr}}@media(max-width:460px){.preset-grid{grid-template-columns:1fr}}
</style>
