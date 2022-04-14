import browser from 'webextension-polyfill';
import { UserAgent } from '../../../common/user-agent';
import {
    Settings,
    SettingOption,
    DEFAULT_FILTERS_UPDATE_PERIOD,
    DEFAULT_FIRST_PARTY_COOKIES_SELF_DESTRUCT_MIN,
    DEFAULT_THIRD_PARTY_COOKIES_SELF_DESTRUCT_MIN,
    ADGUARD_SETTINGS_KEY,
    AppearanceTheme,
} from '../../../common/settings';

export class SettingsStorage {
    /**
     * Computed values are declared in this object instead constructor,
     * because default settings called by reset method
     */
    static defaultSettings: Settings = {
        [SettingOption.CLIENT_ID]: SettingsStorage.genClientId(),

        // user settings
        [SettingOption.DISABLE_SHOW_ADGUARD_PROMO_INFO]: SettingsStorage.isPromoInfoDisabled(),
        [SettingOption.DISABLE_SAFEBROWSING]: true,
        [SettingOption.DISABLE_COLLECT_HITS]: true,
        [SettingOption.DEFAULT_ALLOWLIST_MODE]: true,
        [SettingOption.ALLOWLIST_ENABLED]: true,
        [SettingOption.USE_OPTIMIZED_FILTERS]: UserAgent.isMobile,
        [SettingOption.DISABLE_DETECT_FILTERS]: false,
        [SettingOption.DISABLE_SHOW_APP_UPDATED_NOTIFICATION]: false,
        [SettingOption.FILTERS_UPDATE_PERIOD]: DEFAULT_FILTERS_UPDATE_PERIOD,
        [SettingOption.DISABLE_STEALTH_MODE]: true,
        [SettingOption.HIDE_REFERRER]: true,
        [SettingOption.HIDE_SEARCH_QUERIES]: true,
        [SettingOption.SEND_DO_NOT_TRACK]: true,
        [SettingOption.BLOCK_CHROME_CLIENT_DATA]: UserAgent.isChrome,
        [SettingOption.BLOCK_WEBRTC]: false,
        [SettingOption.SELF_DESTRUCT_THIRD_PARTY_COOKIES]: true,
        [SettingOption.SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME]: DEFAULT_THIRD_PARTY_COOKIES_SELF_DESTRUCT_MIN,
        [SettingOption.SELF_DESTRUCT_FIRST_PARTY_COOKIES]: false,
        [SettingOption.SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME]: DEFAULT_FIRST_PARTY_COOKIES_SELF_DESTRUCT_MIN,
        [SettingOption.APPEARANCE_THEME]: AppearanceTheme.SYSTEM,
        [SettingOption.USER_FILTER_ENABLED]: true,
        [SettingOption.HIDE_RATE_BLOCK]: false,
        [SettingOption.USER_RULES_EDITOR_WRAP]: false,
        [SettingOption.DISABLE_FILTERING]: false,
        [SettingOption.DISABLE_SHOW_PAGE_STATS]: false,
        [SettingOption.DISABLE_SHOW_CONTEXT_MENU]: false,
    };

    settings = SettingsStorage.defaultSettings;

    isInit = false;

    private storage = browser.storage.local;

    async init() {
        const persistentData = await this.storage.get({
            [ADGUARD_SETTINGS_KEY]: SettingsStorage.defaultSettings,
        });

        this.settings = persistentData[ADGUARD_SETTINGS_KEY];
        await this.storage.set({ [ADGUARD_SETTINGS_KEY]: this.settings });
        this.isInit = true;
    }

    async set<T extends SettingOption>(key: T, value: Settings[T]): Promise<void> {
        this.settings[key] = value;
        await this.storage.set({ [ADGUARD_SETTINGS_KEY]: this.settings });
    }

    get<T extends SettingOption>(key: T): Settings[T] {
        if (!this.isInit) {
            throw new Error('The storage is not initialized');
        }

        return this.settings[key];
    }

    getData() {
        return {
            names: SettingOption,
            defaultValues: SettingsStorage.defaultSettings,
            values: this.settings,
        };
    }

    async reset() {
        this.settings = SettingsStorage.defaultSettings;
        await this.storage.set({ [ADGUARD_SETTINGS_KEY]: this.settings });
    }

    private static isPromoInfoDisabled(): boolean {
        return (!UserAgent.isWindows && !UserAgent.isMacOs) || UserAgent.isEdge;
    }

    private static genClientId() {
        const result = [];
        const suffix = (Date.now()) % 1e8;
        const symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890';
        for (let i = 0; i < 8; i += 1) {
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            result.push(symbol);
        }
        return result.join('') + suffix;
    }
}

export const settingsStorage = new SettingsStorage();
