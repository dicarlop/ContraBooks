<template>
  <div class="visual-designer">
    <div class="designer-head">
      <div>
        <strong>Visual Designer</strong>
        <span>Build and format the print layout without writing HTML.</span>
      </div>
      <div class="history-actions">
        <button type="button" :disabled="!canUndo" title="Undo" @click="undo">↶</button>
        <button type="button" :disabled="!canRedo" title="Redo" @click="redo">↷</button>
      </div>
    </div>

    <div class="designer-toolbar">
      <div class="toolbar-group element-group">
        <label>Element</label>
        <select v-model="selectedId" @change="selectElement">
          <option value="">Select an element…</option>
          <option v-for="element in elements" :key="element.id" :value="element.id">{{ element.label }}</option>
        </select>
      </div>
      <div class="toolbar-group text-group">
        <label>Content</label>
        <input v-model="textValue" :disabled="!selectedId || !canEditText" placeholder="Text or field label" @change="applyText" />
      </div>
      <div class="toolbar-group compact">
        <label>Insert</label>
        <select v-model="insertType" @change="insertBlock">
          <option value="">Add block…</option>
          <option value="text">Text</option>
          <option value="heading">Heading</option>
          <option value="divider">Divider</option>
          <option value="spacer">Spacer</option>
          <option value="logo">Company Logo</option>
        </select>
      </div>
      <button type="button" class="logo-button" @click="$emit('insert-logo')">Logo</button>
    </div>

    <div class="designer-tabs">
      <button type="button" :class="{active:tab==='type'}" @click="tab='type'">Layout</button>
      <button type="button" :class="{active:tab==='type'}" @click="tab='type'">Position</button>
      <button type="button" :class="{active:tab==='type'}" @click="tab='type'">Typography</button>
      <button type="button" :class="{active:tab==='type'}" @click="tab='type'">Box</button>
    </div>

    <div class="inspector" v-if="selectedId">
      <div class="inspector-group">
        <label>Font</label>
        <select v-model="fontSize" @change="applyStyle('font-size',fontSize)"><option v-for="size in fontSizes" :key="size" :value="size">{{ size.replace('px','') }} px</option></select>
        <select v-model="fontWeight" @change="applyStyle('font-weight',fontWeight)"><option value="400">Normal</option><option value="500">Medium</option><option value="600">Semibold</option><option value="700">Bold</option><option value="800">Extra Bold</option></select>
        <select v-model="fontStyle" @change="applyStyle('font-style',fontStyle)"><option value="normal">Normal</option><option value="italic">Italic</option></select>
        <select v-model="textAlign" @change="applyStyle('text-align',textAlign)"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option></select>
      </div>
      <div class="inspector-group">
        <label>Colors</label>
        <span>Text</span><input type="color" v-model="textColor" @change="applyStyle('color',textColor)" />
        <span>Fill</span><input type="color" v-model="backgroundColor" @change="applyStyle('background-color',backgroundColor)" />
        <button type="button" class="mini" @click="applyStyle('background-color','transparent')">Clear fill</button>
      </div>
      <div class="inspector-group">
        <label>Spacing</label>
        <select v-model="padding" @change="applyStyle('padding',padding)"><option value="0">Padding 0</option><option value="4px">Padding 4</option><option value="8px">Padding 8</option><option value="12px">Padding 12</option><option value="16px">Padding 16</option><option value="24px">Padding 24</option></select>
        <input v-model="marginTop" aria-label="Margin top" placeholder="Top" @change="applyStyle('margin-top',marginTop)" />
        <input v-model="marginBottom" aria-label="Margin bottom" placeholder="Bottom" @change="applyStyle('margin-bottom',marginBottom)" />
      </div>
      <div class="inspector-group">
        <label>Border</label>
        <select v-model="borderStyle" @change="applyStyle('border-style',borderStyle)"><option value="none">None</option><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option></select>
        <select v-model="borderWidth" @change="applyStyle('border-width',borderWidth)"><option value="0">0</option><option value="1px">1</option><option value="2px">2</option><option value="3px">3</option></select>
        <input type="color" v-model="borderColor" @change="applyStyle('border-color',borderColor)" />
        <select v-model="borderRadius" @change="applyStyle('border-radius',borderRadius)"><option value="0">Square</option><option value="4px">4</option><option value="8px">8</option><option value="12px">12</option></select>
      </div>
      <div class="inspector-group actions">
        <label>Arrange</label>
        <button type="button" @click="moveElement(-1)">↑ Up</button><button type="button" @click="moveElement(1)">↓ Down</button>
        <button type="button" @click="nudge(-1)">←</button><button type="button" @click="nudge(1)">→</button>
        <button type="button" @click="duplicateElement">Duplicate</button><button type="button" class="danger" @click="deleteElement">Delete</button>
      </div>
    </div>

    <div v-else class="designer-empty">Click an element in the live preview to edit it, or choose <b>Add block…</b> to build the layout.</div>
    <div class="designer-help">Changes are live in the preview. Dynamic fields are protected; use Quick Insert or Advanced HTML when a field expression must be changed.</div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

type VisualElement={id:string;label:string;tag:string;text:string};

export default defineComponent({
  name:'TemplateVisualDesigner',
  props:{template:{type:String,required:true},selectedElementId:{type:String,default:''}},
  emits:['update:template','insert-logo','select'],
  data(){return{
    selectedId:this.selectedElementId,tab:'type',insertType:'',textValue:'',fontSize:'14px',fontWeight:'400',fontStyle:'normal',textColor:'#14202B',backgroundColor:'#FFFFFF',textAlign:'left',padding:'0',marginTop:'',marginBottom:'',borderStyle:'none',borderWidth:'0',borderColor:'#DCE7EF',borderRadius:'0',fontSizes:['10px','12px','14px','16px','18px','20px','24px','28px','32px'],history:[this.template],historyIndex:0,applyingHistory:false,
  };},
  computed:{
    elements():VisualElement[]{const doc=this.sourceDocument();return Array.from(doc.body.querySelectorAll('*')).filter(el=>el.tagName!=='SCRIPT'&&el.tagName!=='STYLE').map((node,index)=>{const el=node as HTMLElement;const id=el.getAttribute('data-cb-id')??`cb-${index}`;const text=(el.textContent??'').trim().replace(/\s+/g,' ');return{id,label:`${el.tagName.toLowerCase()}${text?` — ${text.slice(0,42)}`:''}`,tag:el.tagName.toLowerCase(),text};});},
    canEditText():boolean{const el=this.findElement();return !!el&&!el.innerHTML.includes('{{');},
    canUndo():boolean{return this.historyIndex>0;},
    canRedo():boolean{return this.historyIndex<this.history.length-1;},
  },
  watch:{selectedElementId(value:string){this.selectedId=value;this.syncControls();},template(value:string){if(this.applyingHistory){this.applyingHistory=false;return;}const current=this.history[this.historyIndex];if(value!==current){this.history=this.history.slice(0,this.historyIndex+1);this.history.push(value);if(this.history.length>30)this.history.shift();this.historyIndex=this.history.length-1;}this.syncControls();}},
  mounted(){this.ensureIds();this.syncControls();},
  methods:{
    sourceDocument():Document{return new DOMParser().parseFromString(this.template,'text/html');},
    findElement():HTMLElement|null{if(!this.selectedId)return null;const doc=this.sourceDocument();return Array.from(doc.body.querySelectorAll('*')).find(node=>node.getAttribute('data-cb-id')===this.selectedId) as HTMLElement|null;},
    ensureIds(){const doc=this.sourceDocument();let changed=false;Array.from(doc.body.querySelectorAll('*')).filter(el=>el.tagName!=='SCRIPT'&&el.tagName!=='STYLE').forEach((node,index)=>{const el=node as HTMLElement;if(!el.getAttribute('data-cb-id')){el.setAttribute('data-cb-id',`cb-${index}`);changed=true;}});if(changed)this.emitDocument(doc);},
    selectElement(){this.syncControls();this.$emit('select',this.selectedId);},
    syncControls(){const el=this.findElement();if(!el)return;this.textValue=el.textContent?.trim()??'';this.fontSize=el.style.fontSize||'14px';this.fontWeight=el.style.fontWeight||'400';this.fontStyle=el.style.fontStyle||'normal';this.textColor=el.style.color||'#14202B';this.backgroundColor=el.style.backgroundColor||'#FFFFFF';this.textAlign=el.style.textAlign||'left';this.padding=el.style.padding||'0';this.marginTop=el.style.marginTop||'';this.marginBottom=el.style.marginBottom||'';this.borderStyle=el.style.borderStyle||'none';this.borderWidth=el.style.borderWidth||'0';this.borderColor=el.style.borderColor||'#DCE7EF';this.borderRadius=el.style.borderRadius||'0';},
    emitDocument(doc:Document){this.$emit('update:template',doc.body.innerHTML);},
    withSelected(mutator:(el:HTMLElement)=>void){if(!this.selectedId)return;const doc=this.sourceDocument();const el=Array.from(doc.body.querySelectorAll('*')).find(node=>node.getAttribute('data-cb-id')===this.selectedId) as HTMLElement|null;if(!el)return;mutator(el);this.emitDocument(doc);},
    applyStyle(property:string,value:string){this.withSelected(el=>el.style.setProperty(property,value));},
    applyText(){if(!this.canEditText)return;this.withSelected(el=>{el.textContent=this.textValue;});},
    moveElement(direction:number){this.withSelected(el=>{const sibling=direction<0?el.previousElementSibling:el.nextElementSibling;if(!sibling||sibling.tagName==='SCRIPT'||sibling.tagName==='STYLE')return;if(direction<0)sibling.before(el);else sibling.after(el);});},
    nudge(direction:number){this.withSelected(el=>{const current=parseInt(el.style.marginLeft||'0',10)||0;el.style.marginLeft=`${current+direction*8}px`;});},
    duplicateElement(){this.withSelected(el=>{const clone=el.cloneNode(true) as HTMLElement;clone.removeAttribute('data-cb-id');const ids=this.elements.map(item=>item.id);let i=ids.length;let id=`cb-${i}`;while(ids.includes(id)){i+=1;id=`cb-${i}`;}clone.setAttribute('data-cb-id',id);el.after(clone);this.selectedId=id;this.$emit('select',id);});},
    deleteElement(){this.withSelected(el=>{if(el.parentElement)el.remove();this.selectedId='';this.$emit('select','');});},
    insertBlock(){const type=this.insertType;this.insertType='';if(!type)return;const doc=this.sourceDocument();const id=`cb-${Date.now().toString(36)}`;const wrapper=doc.createElement('div');wrapper.setAttribute('data-cb-id',id);wrapper.style.margin='8px 0';if(type==='text'){wrapper.textContent='New text';wrapper.style.fontSize='14px';}else if(type==='heading'){wrapper.textContent='New heading';wrapper.style.fontSize='20px';wrapper.style.fontWeight='700';}else if(type==='divider'){wrapper.innerHTML='<hr />';wrapper.style.border='0';wrapper.style.borderTop='1px solid #DCE7EF';}else if(type==='spacer'){wrapper.innerHTML='&nbsp;';wrapper.style.height='24px';}else{wrapper.innerHTML='<img v-if="print.logo" :src="print.logo" alt="Company Logo" style="max-height:80px;max-width:240px;object-fit:contain;" />';wrapper.style.textAlign='center';}doc.body.append(wrapper);this.selectedId=id;this.emitDocument(doc);this.$emit('select',id);},
    undo(){if(!this.canUndo)return;this.historyIndex-=1;this.applyHistory(this.history[this.historyIndex]);},
    redo(){if(!this.canRedo)return;this.historyIndex+=1;this.applyHistory(this.history[this.historyIndex]);},
    applyHistory(value:string){this.applyingHistory=true;this.$emit('update:template',value);this.syncControls();},
  },
});
</script>
<style scoped>
.visual-designer{background:#fff;border-bottom:1px solid #DCE7EF;color:#173B59;font-family:Inter,system-ui,sans-serif}.designer-head{display:flex;align-items:center;justify-content:space-between;padding:9px 10px 6px;border-bottom:1px solid #EAF0F5}.designer-head strong{display:block;font-size:12px;color:#07345C}.designer-head span{display:block;font-size:9px;color:#7B9AB4;margin-top:2px}.history-actions{display:flex;gap:3px}.history-actions button,.inspector button{height:27px;border:1px solid #DCE7EF;border-radius:5px;background:#fff;color:#07345C;padding:0 7px}.history-actions button{width:28px;padding:0;font-size:15px}.history-actions button:disabled{opacity:.35}.designer-toolbar{display:flex;flex-wrap:wrap;align-items:flex-end;gap:7px;padding:8px 9px}.toolbar-group{display:flex;flex-direction:column;gap:3px}.toolbar-group label,.inspector-group label{font-size:8px;font-weight:800;color:#64748B;text-transform:uppercase}.toolbar-group select,.toolbar-group input,.inspector-group select,.inspector-group input:not([type=color]){height:29px;min-width:78px;border:1px solid #DCE7EF;border-radius:6px;padding:0 6px;font-size:10px;color:#173B59;background:#fff}.element-group select{min-width:170px}.text-group{min-width:190px;flex:1}.text-group input{width:100%;box-sizing:border-box}.logo-button{height:29px;border:0;border-radius:6px;padding:0 10px;background:#00AFC1;color:#fff;font-size:10px;font-weight:700}.designer-tabs{display:flex;border-top:1px solid #EAF0F5;border-bottom:1px solid #EAF0F5;padding:0 8px}.designer-tabs button{border:0;background:transparent;padding:7px 9px;font-size:9px;font-weight:700;color:#64748B}.designer-tabs button.active{color:#00AFC1;border-bottom:2px solid #00AFC1}.inspector{display:flex;flex-wrap:wrap;gap:7px;padding:8px 9px;background:#F8FCFE;border-bottom:1px solid #EAF0F5}.inspector-group{display:flex;align-items:flex-end;gap:4px}.inspector-group label{align-self:center;margin-right:2px}.inspector-group span{font-size:9px;color:#64748B;align-self:center}.inspector-group input[type=color]{width:30px;height:29px;padding:2px;border:1px solid #DCE7EF;border-radius:5px}.inspector-group .mini{font-size:9px}.inspector-group .danger{color:#E5484D}.designer-empty{padding:12px 10px;color:#7B9AB4;font-size:10px}.designer-help{padding:0 9px 8px;color:#7B9AB4;font-size:9px}
</style>
