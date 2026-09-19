<template>
  <ScaledContainer ref="scaledContainer" :scale="Math.max(scale,.1)" :width="width" :height="height" :show-overflow="true" class="mx-auto shadow-lg border">
    <ErrorBoundary v-if="!error" :propagate="false" @error-captured="handleErrorCaptured">
      <div class="template-preview" @click="selectElement" @dragstart="startDrag" @dragover.prevent @drop="dropElement">
        <component :is="templateComponent" class="flex-1 bg-white" :doc="values.doc" :print="values.print" />
      </div>
    </ErrorBoundary>
    <div v-else class="h-full bg-red-100 dark:bg-red-900 dark:bg-opacity-50 w-full text-2xl text-gray-900 dark:text-gray-25 flex flex-col gap-4"><h1 class="text-4xl font-bold text-red-500 dark:text-red-200 p-4 border-b border-red-200 dark:border-red-900">{{ error.name }}</h1><p class="px-4 font-semibold">{{ error.message }}</p><pre v-if="error.detail" class="px-4 text-xl text-gray-700 dark:text-gray-400">{{ error.detail }}</pre></div>
  </ScaledContainer>
</template>
<script lang="ts">
import { compile, CompilerError, generateCodeFrame, SourceLocation } from '@vue/compiler-dom';
import { Verb } from 'fyo/telemetry/types';
import ErrorBoundary from 'src/components/ErrorBoundary.vue';
import { constructPrintDocument, exportTemplatePDF, printTemplate } from '../services/printing';
import type { PrintOptions } from 'src/utils/printOptions';
import type { PrintOrientation, PrintPaper } from 'src/utils/printGeometry';
import { getPrintDimensions } from 'src/utils/printGeometry';
import { PrintValues } from 'src/utils/types';
import { defineComponent, PropType } from 'vue';
import ScaledContainer from './ScaledContainer.vue';
export const baseSafeTemplate=`<main class="h-full w-full bg-white"><p class="p-4 text-red-500"><span class="font-bold">ERROR</span>: Template failed to load due to errors.</p></main>`;
export default defineComponent({
  components:{ScaledContainer,ErrorBoundary},
  props:{template:{type:String,required:true},printSchemaName:{type:String,required:true},scale:{type:Number,default:.65},width:{type:Number,default:21},height:{type:Number,default:29.7},values:{type:Object as PropType<PrintValues>,required:true},repeatHeader:{type:Boolean,default:true},fitWidth:{type:Boolean,default:true},pageNumbers:{type:Boolean,default:true},paper:{type:String as PropType<PrintPaper>,default:'Letter'},orientation:{type:String as PropType<PrintOrientation>,default:'Portrait'}},
  emits:['select-element','move-element'],
  data(){return{error:null} as {error:null|{name:string;message:string;detail?:string}};},
  computed:{templateComponent(){let template=this.template;if(this.error)template=baseSafeTemplate;return{template,props:['doc','print'],computed:{fyo(){return{};},platform(){return'';}}};}},
  watch:{template(value:string){this.compile(value);}},mounted(){this.compile(this.template);},
  methods:{
    compile(template:string){this.error=null;return compile(template,{hoistStatic:true,onWarn:this.onError.bind(this),onError:this.onError.bind(this)});},
    selectElement(event:MouseEvent){const target=event.target;if(!(target instanceof HTMLElement))return;const element=target.closest('[data-cb-id]');const id=element?.getAttribute('data-cb-id');if(id)this.$emit('select-element',id);},
    startDrag(event:DragEvent){const target=event.target;if(!(target instanceof HTMLElement))return;const element=target.closest('[data-cb-id]');const id=element?.getAttribute('data-cb-id');if(!id||!event.dataTransfer)return;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',id);},
    dropElement(event:DragEvent){const target=event.target;if(!(target instanceof HTMLElement)||!event.dataTransfer)return;const draggedId=event.dataTransfer.getData('text/plain');const targetElement=target.closest('[data-cb-id]');const targetId=targetElement?.getAttribute('data-cb-id');if(draggedId&&targetId&&draggedId!==targetId)this.$emit('move-element',draggedId,targetId);},
    handleErrorCaptured(error:unknown){if(!(error instanceof Error))throw error;let name=error.name;let detail='';if(name==='TypeError'&&error.message.includes('Cannot read')){name=this.t`Invalid Key Error`;detail=this.t`Please check Key Hints for valid key names`;}this.error={name,message:error.message,detail};},
    onError({message,loc}:CompilerError){this.error={name:this.t`Template Compilation Error`,detail:loc?this.getCodeFrame(loc):'',message};},
    getCodeFrame(loc:SourceLocation){return generateCodeFrame(this.template,loc.start.offset,loc.end.offset);},
    getPrintOptions():PrintOptions{return{repeatHeader:this.repeatHeader,fitWidth:this.fitWidth,pageNumbers:this.pageNumbers,paper:this.paper,orientation:this.orientation};},
    getInnerHTML():string|null{const innerHTML=(this.$refs.scaledContainer as {$el?:HTMLElement}|undefined)?.$el?.children?.[0]?.innerHTML;return typeof innerHTML==='string'?innerHTML:null;},
    getPDFHtml():string|null{const innerHTML=this.getInnerHTML();return innerHTML?constructPrintDocument(innerHTML,this.getPrintOptions()):null;},
    async getPDF():Promise<Uint8Array|null>{const html=this.getPDFHtml();if(!html)return null;const [width,height]=getPrintDimensions(this.paper,this.orientation);return await ipc.createPDFFromHTML(html,width,height);},
    async savePDF(name?:string,shouldPrint?:boolean){const innerHTML=this.getInnerHTML();if(!innerHTML)return;if(shouldPrint===false)await exportTemplatePDF(name??this.t`Entry`,innerHTML,this.width,this.height,this.getPrintOptions());else await printTemplate(name??this.t`Entry`,innerHTML,this.width,this.height,this.getPrintOptions());this.fyo.telemetry.log(Verb.Printed,this.printSchemaName);},
  },
});
</script>
<style scoped>.template-preview{width:100%;height:100%}.template-preview :deep([data-cb-screen="hidden"]){display:none!important}.template-preview :deep([data-cb-id]){cursor:grab}.template-preview :deep([data-cb-id]:active){cursor:grabbing}.template-preview :deep([data-cb-id]:hover){outline:1px dashed #00AFC1;outline-offset:2px}</style>
