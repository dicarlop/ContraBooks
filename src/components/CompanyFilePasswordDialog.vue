<template>
  <Teleport to="body">
    <Transition>
      <div v-if="open" class="backdrop z-30 flex items-center justify-center" @keydown.esc="cancel">
        <div class="dialog bg-white dark:bg-gray-850 border dark:border-gray-800 rounded-lg text-gray-900 dark:text-gray-25 p-5 shadow-2xl w-dialog flex flex-col gap-4" role="dialog" aria-modal="true" aria-labelledby="password-title">
          <div class="flex items-center justify-between">
            <h1 id="password-title" class="font-semibold text-lg">{{ t`Unlock Company File` }}</h1>
            <FeatherIcon name="lock" class="w-5 h-5 text-blue-500" />
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ error || t`This company file is password protected. Enter the password to continue.` }}</p>
          <label class="flex flex-col gap-2 text-sm font-medium">
            {{ t`Company file password` }}
            <input ref="input" v-model="password" type="password" autocomplete="current-password" class="w-full border rounded-md px-3 py-2 outline-none bg-white dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-blue-400" :placeholder="t`Enter password`" @keydown.enter="submit" />
          </label>
          <div class="flex justify-end gap-3 mt-2">
            <Button type="secondary" @click="cancel">{{ t`Cancel` }}</Button>
            <Button type="primary" :disabled="!password" @click="submit">{{ t`Unlock` }}</Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<script lang="ts">
import { t } from 'fyo';
import { defineComponent, nextTick } from 'vue';
import Button from './Button.vue';
import FeatherIcon from './FeatherIcon.vue';

export default defineComponent({
  name: 'CompanyFilePasswordDialog',
  components: { Button, FeatherIcon },
  props: {
    open: { type: Boolean, default: false },
    error: { type: String, default: '' },
  },
  emits: ['submit', 'cancel'],
  data() {
    return { password: '' };
  },
  watch: {
    open(value: boolean) {
      if (value) {
        this.password = '';
        void nextTick(() => (this.$refs.input as HTMLInputElement | undefined)?.focus());
      }
    },
  },
  methods: {
    submit() {
      if (!this.password) return;
      this.$emit('submit', this.password);
    },
    cancel() {
      this.$emit('cancel');
    },
  },
});
</script>
<style scoped>
.backdrop{position:fixed;inset:0;background:rgba(7,52,92,.35)}
.dialog{max-width:28rem;width:calc(100vw - 2rem)}
</style>
