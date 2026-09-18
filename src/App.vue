import { RTL_LANGUAGES } from 'fyo/utils/consts';
import { ModelNameEnum } from 'models/types';
import { systemLanguageRef } from 'src/utils/refs';
import { defineComponent, provide, ref, Ref } from 'vue';
import WindowsTitleBar from './components/WindowsTitleBar.vue';
import { handleErrorWithDialog } from './errorHandling';
import { fyo } from './initFyo';
import { initializeApps } from './app/registry';
import DatabaseSelector from './pages/DatabaseSelector.vue';
import Desk from './pages/Desk.vue';
import SetupWizard from './pages/SetupWizard/SetupWizard.vue';
import setupInstance from './setup/setupInstance';
import { SetupWizardOptions } from './setup/types';
import './styles/index.css';
import { connectToDatabase, dbErrorActionSymbols } from './utils/db';
import { initializeInstance } from './utils/initialization';
import * as injectionKeys from './utils/injectionKeys';
import { showDialog, showToast } from './utils/interactive';
import { setLanguageMap } from './utils/language';
import { updateConfigFiles } from './utils/misc';
import { updatePrintTemplates } from './utils/printTemplates';
import { Search } from './utils/search';
import { Shortcuts } from './utils/shortcuts';
import { routeTo } from './utils/ui';
import { useKeys } from './utils/vueUtils';
import { setDarkMode } from './utils/theme';
import { registerInstanceToERPNext, updateERPNSyncSettings } from './utils/erpnextSync';
import { ERPNextSyncSettings } from 'models/baseModels/ERPNextSyncSettings/ERPNextSyncSettings';
import { ErrorLogEnum } from 'fyo/telemetry/types';

enum Screen { Desk = 'Desk', DatabaseSelector = 'DatabaseSelector', SetupWizard = 'SetupWizard' }
const THEME_CHANGE_EVENT = 'contrabooks:theme-change';

type ThemeChangeEvent = CustomEvent<{ dark?: boolean }>;

export default defineComponent({
  name: 'App',
  components: { Desk, SetupWizard, DatabaseSelector, WindowsTitleBar },
  setup() {
    const keys = useKeys();
    const searcher: Ref<null | Search> = ref(null);
    const shortcuts = new Shortcuts(keys);
    const languageDirection = ref(getLanguageDirection(systemLanguageRef.value));
    provide(injectionKeys.keysKey, keys);
    provide(injectionKeys.searcherKey, searcher);
    provide(injectionKeys.shortcutsKey, shortcuts);
    provide(injectionKeys.languageDirectionKey, languageDirection);
    const databaseSelector = ref<InstanceType<typeof DatabaseSelector> | null>(null);
    return { keys, searcher, shortcuts, languageDirection, databaseSelector };
  },
  data() {
    return { activeScreen: null, dbPath: '', companyName: '', darkMode: false } as { activeScreen: null | Screen; dbPath: string; companyName: string; darkMode: boolean | undefined };
  },
  computed: { language(): string { return systemLanguageRef.value; } },
  watch: { language(value: string) { this.languageDirection = getLanguageDirection(value); } },
  async mounted() {
    window.addEventListener(THEME_CHANGE_EVENT, this.handleThemeChange as EventListener);
    await initializeApps();
    await this.setInitialScreen();
    const storedTheme = localStorage.getItem('contrabooks-theme');
    const darkMode = storedTheme === 'dark' || (storedTheme === null && !!fyo.singles.SystemSettings?.darkMode);
    setDarkMode(darkMode);
    this.darkMode = darkMode;
  },
  beforeUnmount() {
    window.removeEventListener(THEME_CHANGE_EVENT, this.handleThemeChange as EventListener);
  },
  methods: {
    handleThemeChange(event: ThemeChangeEvent) {
      const dark = !!event.detail?.dark;
      this.darkMode = dark;
      setDarkMode(dark);
    },
    async setInitialScreen(): Promise<void> {
      const lastSelectedFilePath = fyo.config.get('lastSelectedFilePath', null);
      if (typeof lastSelectedFilePath !== 'string' || !lastSelectedFilePath.length) { this.activeScreen = Screen.DatabaseSelector; return; }
      await this.fileSelected(lastSelectedFilePath);
    },
    async setSearcher(): Promise<void> { this.searcher = new Search(fyo); await this.searcher.initializeKeywords(); },
    async setDesk(filePath: string): Promise<void> {
      await setLanguageMap(); this.activeScreen = Screen.Desk; await this.setDeskRoute(); await fyo.telemetry.start(true); await ipc.checkForUpdates(); this.dbPath = filePath;
      this.companyName = (await fyo.getValue(ModelNameEnum.AccountingSettings, 'companyName')) as string; await this.setSearcher(); updateConfigFiles(fyo);
    },
    newDatabase() { this.activeScreen = Screen.SetupWizard; },
    async fileSelected(filePath: string): Promise<void> {
      fyo.config.set('lastSelectedFilePath', filePath);
      if (filePath !== ':memory:' && !(await ipc.checkDbAccess(filePath))) {
        await showDialog({ title: this.t`Cannot open file`, type: 'error', detail: this.t`ContraBooks does not have access to the selected file: ${filePath}` });
        fyo.config.set('lastSelectedFilePath', null); return;
      }
      try { await this.showSetupWizardOrDesk(filePath); }
      catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('Company file password is required')) {
          const unlockKey = window.prompt(this.t`Enter company file password`);
          if (unlockKey === null) { fyo.config.set('lastSelectedFilePath', null); return; }
          try { await this.showSetupWizardOrDesk(filePath, unlockKey); }
          catch (unlockError) { await handleErrorWithDialog(unlockError, undefined, false, true); await this.showDbSelector(); }
          return;
        }
        await handleErrorWithDialog(error, undefined, true, true); await this.showDbSelector();
      }
    },
    async setupComplete(setupWizardOptions: SetupWizardOptions): Promise<void> {
      const companyName = setupWizardOptions.companyName; const filePath = await ipc.getDbDefaultPath(companyName); await setupInstance(filePath, setupWizardOptions, fyo);
      fyo.config.set('lastSelectedFilePath', filePath); await this.setDesk(filePath);
    },
    async showSetupWizardOrDesk(filePath: string, unlockKey?: string): Promise<void> {
      const { countryCode, error, actionSymbol } = await connectToDatabase(this.fyo, filePath, undefined, unlockKey);
      if (!countryCode && error && actionSymbol) return await this.handleConnectionFailed(error, actionSymbol);
      const setupComplete = await fyo.getValue(ModelNameEnum.AccountingSettings, 'setupComplete');
      if (!setupComplete) { this.activeScreen = Screen.SetupWizard; return; }
      await initializeInstance(filePath, false, countryCode, fyo); await updatePrintTemplates(fyo);
      const syncSettingsDoc = (await fyo.doc.getDoc(ModelNameEnum.ERPNextSyncSettings)) as ERPNextSyncSettings;
      const baseURL = syncSettingsDoc.baseURL; const token = syncSettingsDoc.authToken; const enableERPNextSync = fyo.singles.AccountingSettings?.enableERPNextSync;
      if (enableERPNextSync && baseURL && token) {
        try { await registerInstanceToERPNext(fyo); await updateERPNSyncSettings(fyo); await ipc.initScheduler(`${fyo.singles.ERPNextSyncSettings?.dataSyncInterval as string}m`); }
        catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          try {
            const existing = await fyo.db.getAll(ErrorLogEnum.IntegrationErrorLog, { filters: { error: errorMessage }, limit: 1 });
            if (!existing.length) await fyo.doc.getNewDoc(ErrorLogEnum.IntegrationErrorLog, { error: errorMessage, data: JSON.stringify({ instance: fyo.singles.ERPNextSyncSettings?.deviceID, operation: 'register_instance', trigger: 'showSetupWizardOrDesk', baseURL }) }).sync();
          } catch (logError) { throw logError; }
          showToast({ message: 'Connection Failed', type: 'error' });
        }
      }
      await this.setDesk(filePath);
    },
    async handleConnectionFailed(error: Error, actionSymbol: symbol) {
      await this.showDbSelector();
      if (actionSymbol === dbErrorActionSymbols.CancelSelection) return;
      if (actionSymbol === dbErrorActionSymbols.SelectFile) { await this.databaseSelector?.existingDatabase(); return; }
      throw error;
    },
    async setDeskRoute(): Promise<void> {
      const { onboardingComplete } = await fyo.doc.getDoc('GetStarted'); const { hideGetStarted } = await fyo.doc.getDoc('SystemSettings'); let route = '/get-started';
      if (hideGetStarted || onboardingComplete) route = localStorage.getItem('lastRoute') || '/'; await routeTo(route);
    },
    async showDbSelector(): Promise<void> {
      const theme = localStorage.getItem('contrabooks-theme');
      localStorage.clear();
      if (theme) localStorage.setItem('contrabooks-theme', theme);
      fyo.config.set('lastSelectedFilePath', null); fyo.telemetry.stop(); await fyo.purgeCache(); this.activeScreen = Screen.DatabaseSelector; this.dbPath = ''; this.searcher = null; this.companyName = '';
    },
  },
});
function getLanguageDirection(language: string): 'rtl' | 'ltr' { return RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr'; }
