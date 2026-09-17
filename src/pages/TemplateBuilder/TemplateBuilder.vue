<template>
  <div>
    <PageHeader :title="doc && doc.inserted ? doc.name : ''">
      <template v-if="doc && !doc.inserted" #left><FormControl ref="nameField" class="w-60 flex-shrink-0" size="small" :input-class="['font-semibold text-xl']" :df="fields.name" :border="true" :value="doc!.name" @change="doc?.set('name',$event)" /></template>
      <Button v-if="displayDoc && doc?.template" @click="savePDF()">{{ t`Save as PDF` }}</Button>
      <Button v-if="displayDoc && doc?.template" @click="savePDF(true)">{{ t`Print` }}</Button>
      <Button v-if="doc && doc.isCustom && displayDoc" :title="t`Toggle Advanced HTML`" :icon="true" @click="showAdvancedHtml=!showAdvancedHtml"><feather-icon name="code" class="w-4 h-4" /></Button>
      <DropdownWithActions v-if="actions.length" :actions="actions" />
      <Button v-if="doc?.canSave" type="primary" @click="sync()">{{ t`Save` }}</Button>
    </PageHeader>
    <div v-if="doc" class="w-full bg-gray-50 dark:bg-gray-875 grid" :style="templateBuilderBodyStyles">
      <div class="overflow-auto no-scrollbar flex flex-col" :style="templateDisplayStyles">
        <div v-if="canDisplayPreview" class="p-4 overflow-auto custom-scroll custom-scroll-thumb1">
          <PrintContainer ref="printContainer" :print-schema-name="displayDoc!.schemaName" :template="doc.template!" :values="values!" :scale="scale" :height="doc.height" :width="doc.width" @select-element="selectedElementId=$event" />
        </div>
        <p v-else-if="helperMessage" class="text-sm text-gray-700 dark:text-gray-300 p-4">{{ helperMessage }}</p>
        <div class="w-full sticky bottom-0 flex bg-white dark:bg-gray-890 border-t dark:border-gray-800 mt-auto flex-shrink-0">
          <FormControl :title="fields.type.label" class="w-40 border-r dark:border-gray-800 flex-shrink-0" :df="fields.type" :border="false" :value="doc.get('type')" :container-styles="{'border-radius':'0px'}" @change="setType($event)" />
          <Link v-if="doc.type" :title="displayDocField.label" class="w-40 border-r dark:border-gray-800 flex-shrink-0" :df="displayDocField" :border="false" :value="displayDoc?.name" :container-styles="{'border-radius':'0px'}" @change="(value:string)=>setDisplayDoc(value)" />
          <div v-if="canDisplayPreview" class="flex ml-auto gap-2 px-2 w-36 justify-between flex-shrink-0"><p class="text-sm text-gray-600 dark:text-gray-400 my-auto">{{ t`Display Scale` }}</p><input type="number" class="my-auto w-10 text-base text-end bg-transparent text-gray-800 focus:text-gray-900" :value="scale" min="0.1" max="10" step="0.1" @change="setScale" @input="setScale" /></div>
        </div>
      </div>
      <HorizontalResizer :initial-x="panelWidth" :min-x="22*16" :max-x="maxWidth" style="z-index:5" @resize="(x:number)=>panelWidth=x" />
      <div class="border-l dark:border-gray-800 bg-white dark:bg-gray-890 flex flex-col min-h-0" :style="templateDisplayStyles">
        <TemplateVisualDesigner v-if="doc.isCustom && typeof doc.template==='string'" :template="doc.template" :selected-element-id="selectedElementId" @select="selectedElementId=$event" @update:template="setTemplate($event)" @insert-logo="insertLogo" @toggle-advanced="showAdvancedHtml=!showAdvancedHtml" />
        <div v-if="showAdvancedHtml" class="advanced-html-panel min-h-0 flex-1">
          <TemplateEditor v-if="typeof doc.template==='string' && hints" ref="templateEditor" class="overflow-auto custom-scroll custom-scroll-thumb1 h-full" :initial-value="doc.template" :disabled="!doc.isCustom" :hints="hints" @input="()=>templateChanged=true" @blur="(value:string)=>setTemplate(value)" />
        </div>
        <div v-if="templateChanged" class="flex gap-2 p-2 text-sm text-gray-600 dark:text-gray-400 items-center border-t dark:border-gray-800"><ShortcutKeys :keys="applyChangesShortcut" :simple="true" />{{ t` to apply changes` }}</div>
        <div v-if="hints" class="border-t dark:border-gray-800 flex-shrink-0"><div class="flex justify-between items-center cursor-pointer select-none p-2" @click="toggleShowHints"><h2 class="text-base text-gray-900 dark:text-gray-200 font-semibold">{{ t`Key Hints` }}</h2><feather-icon :name="showHints?'chevron-up':'chevron-down'" class="w-4 h-4 text-gray-600 dark:text-gray-400" /></div><Transition name="hints"><div v-if="showHints" class="overflow-auto custom-scroll custom-scroll-thumb1 p-2 border-t dark:border-gray-800" style="max-height:30vh"><TemplateBuilderHint :hints="hints" /></div></Transition></div>
      </div>
    </div>
    <Modal v-if="doc" :open-modal="showSizeModal" @closemodal="showSizeModal=!showSizeModal"><SetPrintSize :doc="doc" @done="showSizeModal=!showSizeModal" /></Modal>
    <Modal v-if="doc" :open-modal="showTypeModal" @closemodal="showTypeModal=!showTypeModal"><SetType :doc="doc" @done="showTypeModal=!showTypeModal" /></Modal>
  </div>
</template>
<script lang="ts">
import { EditorView } from 'codemirror';
import { Doc } from 'fyo/model/doc';
import { PrintTemplate } from 'models/baseModels/PrintTemplate';
import { ModelNameEnum } from 'models/types';
import { saveExportData } from 'reports/commonExporter';
import { Field, TargetField } from 'schemas/types';
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import Link from 'src/components/Controls/Link.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import HorizontalResizer from 'src/components/HorizontalResizer.vue';
import Modal from 'src/components/Modal.vue';
import PageHeader from 'src/components/PageHeader.vue';
import ShortcutKeys from 'src/components/ShortcutKeys.vue';
import { handleErrorWithDialog } from 'src/errorHandling';
import { shortcutsKey } from 'src/utils/injectionKeys';
import { showDialog, showToast } from 'src/utils/interactive';
import { docsPathMap } from 'src/utils/misc';
import { PrintTemplateHint, baseTemplate, getPrintTemplatePropHints, getPrintTemplatePropValues } from 'src/utils/printTemplates';
import { docsPathRef, showSidebar } from 'src/utils/refs';
import { DocRef, PrintValues } from 'src/utils/types';
import { ShortcutKey, focusOrSelectFormControl, getActionsForDoc, getDocFromNameIfExistsElseNew, getSavePath, openSettings, selectTextFile } from 'src/utils/ui';
import { useDocShortcuts } from 'src/utils/vueUtils';
import { getMapFromList } from 'utils/index';
import { computed, defineComponent, inject, ref } from 'vue';
import PrintContainer from './PrintContainer.vue';
import SetPrintSize from './SetPrintSize.vue';
import SetType from './SetType.vue';
import TemplateBuilderHint from './TemplateBuilderHint.vue';
import TemplateEditor from './TemplateEditor.vue';
import TemplateVisualDesigner from './TemplateVisualDesigner.vue';
export default defineComponent({
  components:{PageHeader,Button,DropdownWithActions,PrintContainer,HorizontalResizer,TemplateEditor,TemplateVisualDesigner,FormControl,TemplateBuilderHint,ShortcutKeys,Link,Modal,SetPrintSize},
  provide(){return{doc:computed(()=>this.doc)};},
  props:{name:{type:String,required:true}},
  setup(){const doc=ref(null) as DocRef<PrintTemplate>;const shortcuts=inject(shortcutsKey);let context='TemplateBuilder';if(shortcuts)context=useDocShortcuts(shortcuts,doc,context,false);return{doc,context,shortcuts};},
  data(){return{editMode:false,showHints:false,showAdvancedHtml:false,selectedElementId:'',hints:undefined,values:null,displayDoc:null,scale:.6,panelWidth:22*16,templateChanged:false,showTypeModal:false,showSizeModal:false,preEditMode:{scale:.6,showSidebar:true,panelWidth:22*16}} as {editMode:boolean;showHints:boolean;showAdvancedHtml:boolean;selectedElementId:string;hints?:PrintTemplateHint;values:null|PrintValues;displayDoc:PrintTemplate|null;scale:number;panelWidth:number;templateChanged:boolean;showTypeModal:boolean;showSizeModal:boolean;preEditMode:{scale:number;showSidebar:boolean;panelWidth:number}};},
  computed:{
    canDisplayPreview():boolean{return !!this.displayDoc&&!!this.values&&!!this.doc?.template;},
    applyChangesShortcut(){return[ShortcutKey.ctrl,ShortcutKey.enter];},
    view():EditorView|null{const{view}=this.$refs.templateEditor as {view?:EditorView} ?? {};return view instanceof EditorView?view:null;},
    maxWidth(){return window.innerWidth-12*16-100;},
    actions(){if(!this.doc)return[];const actions=getActionsForDoc(this.doc as Doc);actions.push({label:this.t`Print Settings`,group:this.t`View`,action:async()=>openSettings(ModelNameEnum.PrintSettings)});if(this.doc.isCustom&&!this.showTypeModal)actions.push({label:this.t`Set Template Type`,group:this.t`Action`,action:()=>this.showTypeModal=true});if(this.doc.isCustom&&!this.showSizeModal)actions.push({label:this.t`Set Print Size`,group:this.t`Action`,action:()=>this.showSizeModal=true});if(this.doc.isCustom)actions.push({label:this.t`Select Template File`,group:this.t`Action`,action:this.selectFile.bind(this)});actions.push({label:this.t`Save Template File`,group:this.t`Action`,action:this.saveFile.bind(this)});return actions;},
    fields():Record<string,Field>{return getMapFromList(this.fyo.schemaMap.PrintTemplate?.fields??[],'fieldname');},
    displayDocField():TargetField{const target=this.doc?.type??ModelNameEnum.SalesInvoice;return{fieldname:'displayDoc',label:this.t`Display Doc`,fieldtype:'Link',target};},
    helperMessage(){if(!this.doc)return'';if(!this.doc.type)return this.t`Select a Template type`;if(!this.displayDoc)return this.t`Select a Display Doc to view the Template`;if(!this.doc.template)return this.t`Set a Template value to see the Print Template`;return'';},
    templateBuilderBodyStyles():Record<string,string>{return{'grid-template-columns':`auto 0px ${this.panelWidth}px`,height:'calc(100vh - var(--h-row-largest) - 1px)'};},
    templateDisplayStyles():Record<string,string>{return{height:`calc(100vh - var(--h-row-largest) - 1px - ${this.platform==='Windows'?'var(--h-row-smallest)':'0px'})`};},
  },
  async mounted(){await this.initialize();if(this.fyo.store.isDevelopment){// @ts-ignore
      window.tb=this;}},
  async activated(){await this.initialize();docsPathRef.value=docsPathMap.PrintTemplate??'';this.setShortcuts();},
  deactivated(){docsPathRef.value='';if(this.editMode)this.disableEditMode();if(this.doc?.dirty)return;this.reset();},
  methods:{
    setShortcuts(){if(!this.shortcuts)return;this.shortcuts.ctrl.set(this.context,['Enter'],this.setTemplate.bind(this));this.shortcuts.ctrl.set(this.context,['KeyE'],this.toggleEditMode.bind(this));this.shortcuts.ctrl.set(this.context,['KeyH'],this.toggleShowHints.bind(this));this.shortcuts.ctrl.set(this.context,['Equal'],()=>this.setScale(this.scale+.1));this.shortcuts.ctrl.set(this.context,['Minus'],()=>this.setScale(this.scale-.1));},
    async initialize(){await this.setDoc();if(this.doc?.type)this.hints=getPrintTemplatePropHints(this.doc.type,this.fyo);focusOrSelectFormControl(this.doc as Doc,this.$refs.nameField,false);if(!this.doc?.template)await this.doc?.set('template',baseTemplate);await this.setDisplayInitialDoc();},
    reset(){this.doc=null;this.displayDoc=null;this.selectedElementId='';},
    getTemplateEditorState(){return this.view?this.view.state.doc.toString():this.doc?.template??'';},
    async setTemplate(value?:string){this.templateChanged=false;if(!this.doc?.isCustom)return;value??=this.getTemplateEditorState();await this.doc.set('template',value);},
    async insertLogo(){const editor=this.$refs.templateEditor as {insertLogo?:()=>void}|undefined;if(editor?.insertLogo){editor.insertLogo();return;}if(!this.doc?.template)return;const marker='<div style="text-align:center"><img v-if="print.logo" :src="print.logo" alt="Company Logo" style="max-height:80px;max-width:240px;object-fit:contain;" /></div>';await this.doc.set('template',`${marker}\n${this.doc.template}`);},
    setScale(e:Event|number){let value=this.scale;if(typeof e==='number')value=Number(e.toFixed(2));else if(e instanceof Event&&e.target instanceof HTMLInputElement)value=Number(e.target.value);this.scale=Math.max(Math.min(value,10),.15);},
    toggleShowHints(){this.showHints=!this.showHints;},
    toggleEditMode(){if(!this.doc?.isCustom)return;if(!this.displayDoc)return showToast({type:'warning',message:this.t`Please set a Display Doc`,duration:'short'});this.editMode=!this.editMode;if(this.editMode)this.enableEditMode();else this.disableEditMode();},
    enableEditMode(){this.preEditMode.showSidebar=showSidebar.value;this.preEditMode.panelWidth=this.panelWidth;this.preEditMode.scale=this.scale;this.panelWidth=Math.max(window.innerWidth/2,this.panelWidth);showSidebar.value=false;this.scale=this.getEditModeScale();this.showAdvancedHtml=true;this.view?.focus();},
    disableEditMode(){showSidebar.value=this.preEditMode.showSidebar;this.panelWidth=this.preEditMode.panelWidth;this.scale=this.preEditMode.scale;},
    getEditModeScale(){const div=(this.$refs.printContainer as {$el?:HTMLElement}|undefined)?.$el;if(!(div instanceof HTMLElement))return this.scale;const targetWidth=window.innerWidth/2-32;const currentWidth=div.getBoundingClientRect().width;return Number(((targetWidth*this.scale)/currentWidth).toFixed(2));},
    savePDF(shouldPrint?:boolean){const printContainer=this.$refs.printContainer as {savePDF?:(name?:string,shouldPrint?:boolean)=>void};printContainer?.savePDF?.(this.doc?.name,shouldPrint);},
    async setDisplayInitialDoc(){const schemaName=this.doc?.type;if(!schemaName||this.displayDoc?.schemaName===schemaName)return;const names=(await this.fyo.db.getAll(schemaName,{limit:1,order:'desc',orderBy:'created',filters:{cancelled:false}})) as {name:string}[];const name=names[0]?.name;if(!name){const label=this.fyo.schemaMap[schemaName]?.label??schemaName;await showDialog({title:this.t`No Display Entries Found`,detail:this.t`Please create a ${label} entry to view Template Preview.`,type:'warning'});return;}await this.setDisplayDoc(name);},
    async sync(){if(!this.doc)return;try{await this.doc.sync();}catch(error){await handleErrorWithDialog(error,this.doc as Doc);}},
    async setDoc(){if(this.doc)return;this.doc=(await getDocFromNameIfExistsElseNew(ModelNameEnum.PrintTemplate,this.name)) as PrintTemplate;},
    async setType(value:unknown){if(typeof value!=='string')return;await this.doc?.set('type',value);await this.setDisplayInitialDoc();},
    async setDisplayDoc(value:string){if(!value){delete this.hints;this.values=null;this.displayDoc=null;return;}const schemaName=this.doc?.type;if(!schemaName)return;const displayDoc=await getDocFromNameIfExistsElseNew(schemaName,value);this.hints=getPrintTemplatePropHints(schemaName,this.fyo);this.values=await getPrintTemplatePropValues(displayDoc);this.displayDoc=displayDoc;},
    async selectFile(){const{ name:fileName,text}=await selectTextFile([{name:'Template',extensions:['template.html','html']}]);if(!text)return;await this.doc?.set('template',text);this.view?.dispatch({changes:{from:0,to:this.view.state.doc.length,insert:text}});if(this.doc?.inserted)return;let name:string|null=null;if(fileName.endsWith('.template.html'))name=fileName.split('.template.html')[0];if(!name&&fileName.endsWith('.html'))name=fileName.split('.html')[0];if(name)await this.doc?.set('name',name);},
    async saveFile(){const name=this.doc?.name;const template=this.getTemplateEditorState();if(!name)return showToast({type:'warning',message:this.t`Print Template Name not set`});if(!template)return showToast({type:'warning',message:this.t`Print Template is empty`});const{canceled,filePath}=await getSavePath(name,'template.html');if(canceled||!filePath)return;await saveExportData(template,filePath,this.t`Template file saved`);},
  },
});
</script>
<style scoped>
.designer-mode-bar{height:34px;display:flex;align-items:center;justify-content:space-between;padding:0 9px;border-bottom:1px solid #DCE7EF;background:#F8FCFE;color:#07345C;font-size:10px;flex-shrink:0}.designer-mode-bar button{display:flex;align-items:center;gap:5px;border:0;background:transparent;color:#0072CE;font-size:9px;cursor:pointer}.advanced-html-panel{border-top:1px solid #DCE7EF;background:#F8FCFE;min-height:180px}.hints-enter-from,.hints-leave-to{opacity:0;height:0}.hints-enter-to,.hints-leave-from{opacity:1;height:30vh}.hints-enter-active,.hints-leave-active{transition:all 150ms ease-out}
</style>
