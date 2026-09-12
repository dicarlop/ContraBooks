<template>
  <div>
    <div v-if="value" class="flex items-center gap-2">
      <img :src="value" class="max-w-full" />
      <Button v-if="!isReadOnly" @click="triggerChange(null)">
        {{ t`Remove` }}
      </Button>
    </div>
    <Button v-else-if="!isReadOnly" @click="selectImage">
      {{ t`Attach Image` }}
    </Button>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { fyo } from 'src/initFyo';
import Button from 'src/components/Button.vue';
import { getDataURL } from 'src/utils/misc';
import { mime_types } from 'src/utils/mimeTypes';

export default defineComponent({
  name: 'AttachImage',
  components: { Button },
  props: {
    value: { type: String, default: null },
    isReadOnly: { type: Boolean, default: false },
  },
  methods: {
    triggerChange(value: string | null) {
      this.$emit('change', value);
    },
    async selectImage() {
      if (this.isReadOnly) {
        return;
      }
      const options = {
        title: fyo.t`Select Image`,
        filters: [{ name: 'Image', extensions: Object.keys(mime_types) }],
      };

      const { name, success, data } = await ipc.selectFile(options);

      if (!success) {
        return;
      }
      const extension = name.split('.').at(-1);
      if (!extension) {
        return;
      }
      const type = mime_types[extension];
      if (!type) {
        return;
      }
      const dataURL = await getDataURL(type, data);

      // @ts-ignore
      this.triggerChange(dataURL);
    },
  },
});
</script>