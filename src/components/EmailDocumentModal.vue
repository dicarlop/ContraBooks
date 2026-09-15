<template>
  <Modal :open-modal="open" class="w-full max-w-2xl" @closemodal="$emit('close')">
    <div class="p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">{{ t`Email Document` }}</h2>
        <Button type="secondary" @click="$emit('close')">{{ t`Close` }}</Button>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <label class="space-y-1">
          <span class="text-sm text-gray-600 dark:text-gray-300">{{ t`To` }}</span>
          <input v-model="toText" class="form-input w-full" type="text" :placeholder="t`customer@example.com`" />
        </label>
        <label class="space-y-1">
          <span class="text-sm text-gray-600 dark:text-gray-300">{{ t`CC` }}</span>
          <input v-model="ccText" class="form-input w-full" type="text" />
        </label>
        <label class="space-y-1">
          <span class="text-sm text-gray-600 dark:text-gray-300">{{ t`BCC` }}</span>
          <input v-model="bccText" class="form-input w-full" type="text" />
        </label>
        <label class="space-y-1">
          <span class="text-sm text-gray-600 dark:text-gray-300">{{ t`Subject` }}</span>
          <input v-model="subject" class="form-input w-full" type="text" />
        </label>
        <label class="space-y-1">
          <span class="text-sm text-gray-600 dark:text-gray-300">{{ t`Message` }}</span>
          <textarea v-model="text" class="form-textarea w-full min-h-48" rows="8"></textarea>
        </label>
      </div>

      <div class="text-sm text-gray-600 dark:text-gray-300">
        <span v-if="attachment">{{ t`Attachment` }}: {{ attachment.filename }}</span>
        <span v-else>{{ t`The PDF attachment will be added when the document is ready.` }}</span>
      </div>

      <div class="flex justify-end gap-2">
        <Button type="secondary" @click="$emit('close')">{{ t`Cancel` }}</Button>
        <Button type="primary" :disabled="!canSend || sending" @click="send">
          {{ sending ? t`Sending...` : t`Send` }}
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import { createDocumentEmail } from 'src/utils/email';
import type { DocumentEmailContext, EmailAttachment } from 'src/utils/email';
import { defineComponent, PropType } from 'vue';
import Button from './Button.vue';
import Modal from './Modal.vue';

const splitAddresses = (value: string): string[] =>
  value.split(/[;,]/).map((item) => item.trim()).filter(Boolean);

export default defineComponent({
  name: 'EmailDocumentModal',
  components: { Button, Modal },
  props: {
    open: { type: Boolean, default: false },
    context: { type: Object as PropType<DocumentEmailContext>, required: true },
    initialTo: { type: String, default: '' },
    attachment: { type: Object as PropType<EmailAttachment>, default: undefined },
    sending: { type: Boolean, default: false },
  },
  emits: ['close', 'send'],
  data() {
    return {
      toText: this.initialTo,
      ccText: '',
      bccText: '',
      subject: '',
      text: '',
    };
  },
  computed: {
    canSend(): boolean {
      return splitAddresses(this.toText).length > 0 && this.subject.trim().length > 0;
    },
  },
  watch: {
    open(value: boolean) {
      if (!value) return;
      const message = createDocumentEmail(this.context, splitAddresses(this.initialTo), this.attachment);
      this.toText = this.initialTo;
      this.ccText = '';
      this.bccText = '';
      this.subject = message.subject;
      this.text = message.text;
    },
  },
  methods: {
    send() {
      if (!this.canSend) return;
      this.$emit('send', {
        to: splitAddresses(this.toText),
        cc: splitAddresses(this.ccText),
        bcc: splitAddresses(this.bccText),
        subject: this.subject,
        text: this.text,
        attachments: this.attachment ? [this.attachment] : [],
      });
    },
  },
});
</script>
