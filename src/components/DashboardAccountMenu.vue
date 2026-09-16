<template>
  <div class="account-menu" role="menu">
    <div class="account-menu-header">
      <div class="menu-avatar">{{ initials }}</div>
      <div><strong>{{ firstName }}</strong><span>{{ companyName || 'Company file' }}</span></div>
    </div>

    <div class="menu-section">
      <div class="menu-section-title">Company</div>
      <button type="button" @click="switchCompany"><feather-icon name="refresh-cw" />Switch Company Database</button>
    </div>

    <div class="menu-divider"></div>
    <div class="menu-section">
      <div class="menu-section-title">Settings</div>
      <button type="button" @click="settings('AccountingSettings')"><feather-icon name="settings" />General Settings</button>
      <button type="button" @click="settings('PrintSettings')"><feather-icon name="printer" />Print &amp; Templates</button>
      <button type="button" @click="settingsTab('Email')"><feather-icon name="mail" />Email Settings</button>
      <button type="button" @click="settings('SystemSettings')"><feather-icon name="sliders" />System Settings</button>
    </div>

    <div class="menu-divider"></div>
    <div class="menu-section">
      <div class="menu-section-title">Appearance</div>
      <button class="theme-switch" type="button" @click="toggleDarkMode" :aria-pressed="darkMode">
        <feather-icon :name="darkMode ? 'moon' : 'sun'" />
        <span>{{ darkMode ? 'Dark Mode' : 'Light Mode' }}</span>
        <span class="theme-toggle" :class="{ dark: darkMode }"><i></i></span>
      </button>
    </div>

    <div class="menu-divider"></div>
    <div class="menu-section">
      <div class="menu-section-title">Templates</div>
      <button class="template-entry" type="button" @click="routeTo('/template-builder')"><feather-icon name="layout" /><span><strong>Template Builder</strong><small>Professional, Simple, Modern, Classic &amp; Custom</small></span><feather-icon name="chevron-right" class="arrow" /></button>
      <button type="button" @click="routeTo('/list/PrintTemplate')"><feather-icon name="file-text" />Manage Templates</button>
    </div>

    <div class="menu-divider"></div>
    <button class="menu-footer" type="button" @click="routeTo('/')"><feather-icon name="home" />Dashboard</button>
  </div>
</template>

<script lang="ts">
import FeatherIcon from 'src/components/FeatherIcon.vue';
import { routeTo } from 'src/utils/ui';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'DashboardAccountMenu',
  components: { FeatherIcon },
  props: {
    firstName: { type: String, default: 'there' },
    initials: { type: String, default: 'CB' },
    companyName: { type: String, default: '' },
  },
  data() {
    return { darkMode: false };
  },
  mounted() {
    this.darkMode = document.documentElement.classList.contains('dark');
  },
  methods: {
    routeTo,
    async switchCompany() {
      window.dispatchEvent(new CustomEvent('contrabooks:switch-company'));
    },
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      document.documentElement.classList.toggle('dark', this.darkMode);
      localStorage.setItem('contrabooks-theme', this.darkMode ? 'dark' : 'light');
      window.dispatchEvent(new CustomEvent('contrabooks:theme-change', { detail: { dark: this.darkMode } }));
    },
    async settings(tab: string) {
      await routeTo(`/settings?tab=${encodeURIComponent(tab)}`);
    },
    async settingsTab(tab: string) {
      await routeTo(`/settings?tab=${encodeURIComponent(tab)}`);
    },
  },
});
</script>

<style scoped>
.account-menu{position:absolute;top:52px;right:0;width:292px;padding:8px;border:1px solid #DCE7EF;border-radius:12px;background:#fff;box-shadow:0 14px 34px rgba(7,52,92,.18);z-index:30;color:#14202B}.account-menu-header{display:flex;align-items:center;gap:10px;padding:9px 9px 12px}.menu-avatar{width:38px;height:38px;display:grid;place-items:center;border-radius:50%;background:#07345C;color:#fff;font-size:11px;font-weight:800}.account-menu-header div:last-child{display:flex;flex-direction:column;gap:2px;min-width:0}.account-menu-header strong{font-size:12px;color:#07345C}.account-menu-header span{font-size:9px;color:#7B9AB4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.menu-section-title{padding:6px 9px 5px;color:#7B9AB4;text-transform:uppercase;letter-spacing:.8px;font-size:8px;font-weight:800}.menu-section button,.menu-footer{width:100%;min-height:34px;display:flex;align-items:center;gap:9px;padding:0 9px;border:0;border-radius:7px;background:#fff;color:#17466D;text-align:left;font-size:10px;cursor:pointer}.menu-section button:hover,.menu-footer:hover{background:#F3FAFC;color:#0072CE}.menu-section button>svg,.menu-footer>svg{width:15px!important;height:15px!important;flex:0 0 15px;color:#00AFC1}.menu-divider{height:1px;margin:6px 8px;background:#EAF0F5}.template-entry{gap:8px!important}.template-entry>span{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}.template-entry strong{font-size:10px;color:#07345C}.template-entry small{font-size:8px;line-height:1.35;color:#7B9AB4}.template-entry .arrow{width:13px!important;height:13px!important;color:#0072CE!important}.menu-footer{color:#64748B}.theme-switch{gap:9px!important}.theme-switch>span:nth-child(2){flex:1}.theme-toggle{width:36px!important;height:20px!important;min-width:36px!important;padding:2px!important;border-radius:11px!important;background:#E8F0F5!important;border:1px solid #C9D9E4!important;display:flex!important;align-items:center!important;justify-content:flex-start!important}.theme-toggle i{width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(7,52,92,.25);transition:transform 160ms ease}.theme-toggle.dark{background:#07345C!important;border-color:#00AFC1!important;justify-content:flex-end!important}.theme-toggle.dark i{background:#18C6D3}
:global(html.dark) .account-menu{border-color:#173B57;background:#09243A;color:#E6F4FF;box-shadow:0 14px 34px rgba(0,0,0,.45)}
:global(html.dark) .menu-section button,:global(html.dark) .menu-footer{background:#09243A;color:#C9E4F4}
:global(html.dark) .menu-section button:hover,:global(html.dark) .menu-footer:hover{background:#103550;color:#fff}
:global(html.dark) .menu-divider{background:#173B57}
:global(html.dark) .account-menu-header strong,:global(html.dark) .template-entry strong{color:#fff}
:global(html.dark) .theme-toggle{background:#173B57!important;border-color:#31546C!important}
</style>
