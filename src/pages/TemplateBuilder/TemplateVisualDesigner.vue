<template>
  <div class="visual-designer">
    <div class="designer-toolbar">
      <div class="toolbar-group element-group"><label>Element</label><select v-model="selectedId" @change="selectElement"><option value="">Select an element…</option><option v-for="element in elements" :key="element.id" :value="element.id">{{ element.label }}</option></select></div>
      <div class="toolbar-group text-group"><label>Text</label><input v-model="textValue" :disabled="!selectedId || !canEditText" placeholder="Label or heading" @change="applyText" /></div>
      <div class="toolbar-group compact"><label>Size</label><select v-model="fontSize" :disabled="!selectedId" @change="applyStyle('font-size',fontSize)"><option v-for="size in fontSizes" :key="size" :value="size">{{ size.replace('px','') }}</option></select></div>
      <div class="toolbar-group compact"><label>Weight</label><select v-model="fontWeight" :disabled="!selectedId" @change="applyStyle('font-weight',fontWeight)"><option value="400">Normal</option><option value="500">Medium</option><option value="600">Semibold</option><option value="700">Bold</option><option value="800">Extra Bold</option></select></div>
      <div class="toolbar-group compact"><label>Style</label><select v-model="fontStyle" :disabled="!selectedId" @change="applyStyle('font-style',fontStyle)"><option value="normal">Normal</option><option value="italic">Italic</option></select></div>
      <div class="toolbar-group compact"><label>Text</label><input type="color" v-model="textColor" :disabled="!selectedId" @change="applyStyle('color',textColor)" /></div>
      <div class="toolbar-group compact"><label>Fill</label><input type="color" v-model="backgroundColor" :disabled="!selectedId" @change="applyStyle('background-color',backgroundColor)" /></div>
      <div class="toolbar-group compact"><label>Align</label><select v-model="textAlign" :disabled="!selectedId" @change="applyStyle('text-align',textAlign)"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div>
      <div class="toolbar-group compact"><label>Padding</label><select v-model="padding" :disabled="!selectedId" @change="applyStyle('padding',padding)"><option value="0">0</option><option value="4px">4</option><option value="8px">8</option><option value="12px">12</option><option value="16px">16</option><option value="24px">24</option></select></div>
      <div class="toolbar-group move"><label>Position</label><div><button type="button" :disabled="!selectedId" title="Move up" @click="moveElement(-1)">↑</button><button type="button" :disabled="!selectedId" title="Move down" @click="moveElement(1)">↓</button><button type="button" :disabled="!selectedId" title="Move left" @click="nudge(-1)">←</button><button type="button" :disabled="!selectedId" title="Move right" @click="nudge(1)">→</button></div></div>
      <button type="button" class="logo-button" @click="$emit('insert-logo')">＋ Insert Logo</button>
    </div>
    <div class="designer-help">Select any preview element, then change text, typography, color, fill, padding or position. Logo insertion opens the company-logo control. No HTML editing is required.</div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
type VisualElement={id:string;label:string;tag:string;text:string;style:CSSStyleDeclaration};
export default defineComponent({
  name:'TemplateVisualDesigner',
  props:{template:{type:String,required:true},selectedElementId:{type:String,default:''}},
  emits:['update:template','insert-logo','select'],
  data(){return{selectedId:this.selectedElementId,fontSize:'14px',fontWeight:'400',fontStyle:'normal',textColor:'#14202B',backgroundColor:'#FFFFFF',textAlign:'left',padding:'0',textValue:'',fontSizes:['10px','12px','14px','16px','18px','20px','24px','28px','32px']};},
  computed:{
    elements():VisualElement[]{const doc=this.sourceDocument();let changed=false;return Array.from(doc.body.querySelectorAll('*')).filter(el=>el.tagName!=='SCRIPT'&&el.tagName!=='STYLE').map((node,index)=>{const el=node as HTMLElement;let id=el.getAttribute('data-cb-id');if(!id){id=`cb-${index}`;el.setAttribute('data-cb-id',id);changed=true;}const text=(el.textContent??'').trim().replace(/\s+/g,' ');return{id,label:`${el.tagName.toLowerCase()}${text?` — ${text.slice(0,42)}`:''}`,tag:el.tagName.toLowerCase(),text,style:el.style};});},
    canEditText():boolean{const el=this.findElement();return !!el&&!el.innerHTML.includes('{{');},
  },
  watch:{selectedElementId(value:string){this.selectedId=value;this.syncControls();},template(){this.syncControls();}},
  mounted(){this.ensureIds();this.syncControls();},
  methods:{
    sourceDocument():Document{return new DOMParser().parseFromString(this.template,'text/html');},
    findElement():HTMLElement|null{if(!this.selectedId)return null;const doc=this.sourceDocument();return Array.from(doc.body.querySelectorAll('*')).find(node=>node.getAttribute('data-cb-id')===this.selectedId) as HTMLElement|null;},
    ensureIds(){const doc=this.sourceDocument();let changed=false;Array.from(doc.body.querySelectorAll('*')).filter(el=>el.tagName!=='SCRIPT'&&el.tagName!=='STYLE').forEach((node,index)=>{const el=node as HTMLElement;if(!el.getAttribute('data-cb-id')){el.setAttribute('data-cb-id',`cb-${index}`);changed=true;}});if(changed)this.emitDocument(doc);},
    selectElement(){this.syncControls();this.$emit('select',this.selectedId);},
    syncControls(){const el=this.findElement();if(!el)return;this.textValue=el.textContent?.trim()??'';this.fontSize=el.style.fontSize||'14px';this.fontWeight=el.style.fontWeight||'400';this.fontStyle=el.style.fontStyle||'normal';this.textColor=el.style.color||'#14202B';this.backgroundColor=el.style.backgroundColor||'#FFFFFF';this.textAlign=el.style.textAlign||'left';this.padding=el.style.padding||'0';},
    emitDocument(doc:Document){this.$emit('update:template',doc.body.innerHTML);},
    withSelected(mutator:(el:HTMLElement)=>void){if(!this.selectedId)return;const doc=this.sourceDocument();const el=Array.from(doc.body.querySelectorAll('*')).find(node=>node.getAttribute('data-cb-id')===this.selectedId) as HTMLElement|null;if(!el)return;mutator(el);this.emitDocument(doc);},
    applyStyle(property:string,value:string){this.withSelected(el=>el.style.setProperty(property,value));},
    applyText(){if(!this.canEditText)return;this.withSelected(el=>{el.textContent=this.textValue;});},
    moveElement(direction:number){this.withSelected(el=>{const sibling=direction<0?el.previousElementSibling:el.nextElementSibling;if(!sibling||sibling.tagName==='SCRIPT'||sibling.tagName==='STYLE')return;if(direction<0)sibling.before(el);else sibling.after(el);});},
    nudge(direction:number){this.withSelected(el=>{const current=parseInt(el.style.marginLeft||'0',10)||0;el.style.marginLeft=`${current+direction*8}px`;});},
  },
});
</script>
<style scoped>
.visual-designer{background:#fff;border-bottom:1px solid #DCE7EF}.designer-toolbar{display:flex;flex-wrap:wrap;align-items:flex-end;gap:7px;padding:9px}.toolbar-group{display:flex;flex-direction:column;gap:3px}.toolbar-group label{font-size:8px;font-weight:700;color:#64748B;text-transform:uppercase}.toolbar-group select,.toolbar-group input[type=text],.toolbar-group input:not([type]){height:29px;min-width:78px;border:1px solid #DCE7EF;border-radius:6px;padding:0 6px;font-size:10px;color:#173B59;background:#fff}.element-group select{min-width:165px}.text-group{min-width:180px;flex:1}.text-group input{width:100%;box-sizing:border-box}.toolbar-group input[type=color]{width:34px;height:29px;padding:2px;border:1px solid #DCE7EF;border-radius:6px}.compact select{min-width:62px}.move div{display:flex;gap:2px}.move button{width:27px;height:29px;border:1px solid #DCE7EF;border-radius:5px;background:#fff;color:#07345C}.move button:disabled{opacity:.4}.logo-button{height:29px;border:0;border-radius:6px;padding:0 9px;background:#00AFC1;color:#fff;font-size:10px;font-weight:700}.designer-help{padding:0 9px 8px;color:#7B9AB4;font-size:9px}
</style>
