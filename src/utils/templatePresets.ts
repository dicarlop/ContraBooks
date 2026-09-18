export type TemplatePresetName =
  | 'Professional'
  | 'Simple'
  | 'Modern'
  | 'Classic'
  | 'Custom';

export const templatePresetNames: TemplatePresetName[] = [
  'Professional',
  'Simple',
  'Modern',
  'Classic',
  'Custom',
];

const shared = `
  <div style="font-family: Inter, Arial, sans-serif; color: #14202B; padding: 34px; background: white; min-height: 100%; box-sizing: border-box;">
    <div style="display:flex; justify-content:space-between; gap:30px; border-bottom:1px solid #DCE7EF; padding-bottom:22px;">
      <div>
        <div data-cb-section="companyName" style="font-size:24px; font-weight:800; color:#07345C;">{{ print.companyName }}</div>
        <div data-cb-section="address" style="font-size:12px; color:#64748B; margin-top:5px;">{{ print.address }}</div>
        <div data-cb-section="phone" style="font-size:12px; color:#64748B;">{{ print.phone }} · {{ print.email }}</div><div data-cb-section="email" style="font-size:12px; color:#64748B;">{{ print.email }}</div>
      </div>
      <div style="text-align:right;">
        <div data-cb-section="title" style="font-size:28px; font-weight:800; color:#07345C;">INVOICE</div>
        <div data-cb-section="number" style="font-size:12px; color:#64748B; margin-top:6px;">#{{ doc.name }}</div>
        <div style="font-size:12px; color:#64748B;">{{ doc.date }}</div>
      </div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin:24px 0;">
      <div><div style="font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#7B9AB4;">Bill To</div><div style="font-size:15px; font-weight:700; color:#07345C; margin-top:6px;">{{ doc.links.party.name }}</div><div style="font-size:12px; color:#64748B; margin-top:3px;">{{ doc.links.party.address }}</div></div>
      <div style="text-align:right;"><div style="font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#7B9AB4;">Amount Due</div><div style="font-size:22px; font-weight:800; color:#07345C; margin-top:6px;">{{ doc.grandTotal }}</div></div>
    </div>
    <table style="width:100%; border-collapse:collapse; font-size:12px;">
      <thead><tr style="background:#F5F9FC; color:#375E7F;"><th style="padding:10px; text-align:left;">Item</th><th style="padding:10px; text-align:right;">Qty</th><th style="padding:10px; text-align:right;">Rate</th><th style="padding:10px; text-align:right;">Amount</th></tr></thead>
      <tbody><tr v-for="item in doc.items" style="border-bottom:1px solid #EAF0F5;"><td style="padding:11px;">{{ item.item }}</td><td style="padding:11px; text-align:right;">{{ item.quantity }}</td><td style="padding:11px; text-align:right;">{{ item.rate }}</td><td style="padding:11px; text-align:right; font-weight:600;">{{ item.amount }}</td></tr></tbody>
    </table>
    <div style="display:flex; justify-content:flex-end; margin-top:22px;"><div style="width:240px; font-size:12px;"><div data-cb-section="subtotal" style="display:flex; justify-content:space-between; padding:6px 0;"><span>Subtotal</span><strong>{{ doc.subTotal }}</strong></div><div data-cb-section="balance" style="display:flex; justify-content:space-between; padding:10px 0; border-top:2px solid #00AFC1; color:#07345C; font-size:15px;"><span>Total</span><strong>{{ doc.grandTotal }}</strong></div></div></div>
    <div data-cb-section="footer" style="margin-top:36px; padding-top:14px; border-top:1px solid #EAF0F5; font-size:10px; color:#7B9AB4;">Thank you for your business. {{ print.termsAndConditions }}</div>
  </div>`;

export const templatePresets: Record<TemplatePresetName, string> = {
  Professional: `<main style="min-height:100%; background:#fff; border-top:8px solid #07345C;">${shared}</main>`,
  Simple: `<main style="min-height:100%; background:#fff;">${shared.replace('border-bottom:1px solid #DCE7EF;', 'border-bottom:1px solid #EAF0F5;').replace('font-size:28px; font-weight:800; color:#07345C;', 'font-size:24px; font-weight:700; color:#14202B;')}</main>`,
  Modern: `<main style="min-height:100%; background:#F5F9FC; padding:18px; box-sizing:border-box;"><div style="background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 8px 24px rgba(7,52,92,.08); border:1px solid #DCE7EF;">${shared.replace('padding: 34px;', 'padding:30px;').replace('border-bottom:1px solid #DCE7EF;', 'border-bottom:3px solid #18C6D3;')}</div></main>`,
  Classic: `<main style="min-height:100%; background:#fff; border:1px solid #C8D5DF;">${shared.replace('font-family: Inter, Arial, sans-serif;', 'font-family: Georgia, Times New Roman, serif;').replace('color: #07345C;', 'color:#14202B;')}</main>`,
  Custom: `<main style="min-height:100%; background:#fff; border:2px dashed #18C6D3;">${shared}</main>`,
};

export function getTemplatePreset(name: TemplatePresetName): string {
  return templatePresets[name];
}
