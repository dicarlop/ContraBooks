<template>
  <div class="p-4 space-y-4">
    <div>
      <div class="text-base font-semibold text-gray-900 dark:text-gray-100">
        {{ t`Email` }}
      </div>
      <div class="text-sm text-gray-600 dark:text-gray-400">
        {{ t`Configure the SMTP account used to send customer documents.` }}
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <Data
        :df="field('host', 'SMTP Host')"
        :value="settings.host"
        :show-label="true"
        :border="true"
        @input="settings.host = inputValue($event)"
      />
      <Data
        :df="field('port', 'SMTP Port')"
        :value="settings.port"
        :show-label="true"
        :border="true"
        @input="settings.port = Number(inputValue($event)) || 587"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <Data
        :df="field('username', 'Username')"
        :value="settings.username"
        :show-label="true"
        :border="true"
        @input="settings.username = inputValue($event)"
      />
      <Data
        :df="field('password', 'Password')"
        :value="settings.password"
        :show-label="true"
        :border="true"
        @input="settings.password = inputValue($event)"
      />
    </div>

    <Data
      :df="field('from', 'From Address')"
      :value="settings.from"
      :show-label="true"
      :border="true"
      @input="settings.from = inputValue($event)"
    />

    <Check
      :df="field('secure', 'Use secure connection')"
      :value="settings.secure"
      :show-label="true"
      @change="settings.secure = Boolean($event)"
    />

    <div class="flex justify-end gap-2">
      <Button type="primary" :disabled="saving" @click="save">
        {{ saving ? t`Saving...` : t`Save Email Settings` }}
      </Button>
    </div>

    <div v-if="message" class="text-sm text-gray-600 dark:text-gray-400">
      {{ message }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Button from 'src/components/Button.vue';
import Check from 'src/components/Controls/Check.vue';
import Data from 'src/components/Controls/Data.vue';

export default defineComponent({
  name: 'EmailSettings',
  components: { Button, Check, Data },
  data() {
    return {
      saving: false,
      message: '',
      settings: {
        host: '',
        port: 587,
        secure: false,
        username: '',
        password: '',
        from: '',
      },
    };
  },
  async mounted() {
    this.settings = await ipc.getEmailSettings();
  },
  methods: {
    field(fieldname: string, label: string) {
      return { fieldname, label, fieldtype: 'Data' };
    },
    inputValue(event: Event): string {
      const target = event.target;
      return target instanceof HTMLInputElement ? target.value : '';
    },
    async save() {
      this.saving = true;
      this.message = '';
      try {
        await ipc.setEmailSettings(this.settings);
        this.message = this.t`Email settings saved.`;
      } catch (error) {
        this.message = error instanceof Error ? error.message : this.t`Unable to save email settings.`;
      } finally {
        this.saving = false;
      }
    },
  },
});
</script>
