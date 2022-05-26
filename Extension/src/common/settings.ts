import { z } from 'zod';

export const ADGUARD_SETTINGS_KEY = 'adguard-settings';

export enum SettingOption {
    CLIENT_ID = 'clentId',

    // filters states

    FILTERS_STATE_PROP = 'filters-state',
    FILTERS_VERSION_PROP = 'filters-version',
    GROUPS_STATE_PROP = 'groups-state',

    // filters metadata

    METADATA = 'filters-metadata',
    I18N_METADATA = 'filters-i18n-metadata',

    CUSTOM_FILTERS = 'custom_filters',

    // page stats

    PAGE_STATISTIC = 'page-statistic',

    // user settings

    DISABLE_DETECT_FILTERS = 'detect-filters-disabled',
    DISABLE_SHOW_PAGE_STATS = 'disable-show-page-statistic',

    /* flag used to show link to comparison of desktop and browser adblocker versions */
    DISABLE_SHOW_ADGUARD_PROMO_INFO = 'show-info-about-adguard-disabled',

    DISABLE_SAFEBROWSING = 'safebrowsing-disabled',
    DISABLE_FILTERING = 'adguard-disabled',
    DISABLE_COLLECT_HITS = 'hits-count-disabled',
    DISABLE_SHOW_CONTEXT_MENU = 'context-menu-disabled',
    USE_OPTIMIZED_FILTERS = 'use-optimized-filters',
    DEFAULT_ALLOWLIST_MODE = 'default-whitelist-mode',
    ALLOWLIST_ENABLED = 'allowlist-enabled',
    DISABLE_SHOW_APP_UPDATED_NOTIFICATION = 'show-app-updated-disabled',
    FILTERS_UPDATE_PERIOD = 'filters-update-period',
    APPEARANCE_THEME = 'appearance-theme',

    /* User filter */
    USER_FILTER_ENABLED = 'user-filter-enabled',

    /* STEALTH MODE */
    DISABLE_STEALTH_MODE = 'stealth-disable-stealth-mode',
    HIDE_REFERRER = 'stealth-hide-referrer',
    HIDE_SEARCH_QUERIES = 'stealth-hide-search-queries',
    SEND_DO_NOT_TRACK = 'stealth-send-do-not-track',
    BLOCK_CHROME_CLIENT_DATA = 'stealth-remove-x-client',
    BLOCK_WEBRTC = 'stealth-block-webrtc',
    SELF_DESTRUCT_THIRD_PARTY_COOKIES = 'stealth-block-third-party-cookies',
    SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME = 'stealth-block-third-party-cookies-time',
    SELF_DESTRUCT_FIRST_PARTY_COOKIES = 'stealth-block-first-party-cookies',
    SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME = 'stealth-block-first-party-cookies-time',

    /* UI misc */
    HIDE_RATE_BLOCK = 'hide-rate-block',
    USER_RULES_EDITOR_WRAP = 'user-rules-editor-wrap',
}

export const enum AppearanceTheme {
    SYSTEM = 'system',
    DARK = 'dark',
    LIGHT = 'light',
}

export const DEFAULT_FILTERS_UPDATE_PERIOD = -1;

export const DEFAULT_FIRST_PARTY_COOKIES_SELF_DESTRUCT_MIN = 4320;

export const DEFAULT_THIRD_PARTY_COOKIES_SELF_DESTRUCT_MIN = 2880;

export type Settings = {
    [SettingOption.CLIENT_ID]: string,

    [SettingOption.DISABLE_SHOW_ADGUARD_PROMO_INFO]: boolean,
    [SettingOption.DISABLE_SAFEBROWSING]: boolean,
    [SettingOption.DISABLE_COLLECT_HITS]: boolean,
    [SettingOption.DEFAULT_ALLOWLIST_MODE]: boolean,
    [SettingOption.ALLOWLIST_ENABLED]: boolean,
    [SettingOption.USE_OPTIMIZED_FILTERS]: boolean,
    [SettingOption.DISABLE_DETECT_FILTERS]: boolean,
    [SettingOption.DISABLE_SHOW_APP_UPDATED_NOTIFICATION]: boolean,
    [SettingOption.FILTERS_UPDATE_PERIOD]: number,
    [SettingOption.DISABLE_STEALTH_MODE]: boolean,
    [SettingOption.HIDE_REFERRER]: boolean,
    [SettingOption.HIDE_SEARCH_QUERIES]: boolean,
    [SettingOption.SEND_DO_NOT_TRACK]: boolean,
    [SettingOption.BLOCK_CHROME_CLIENT_DATA]: boolean,
    [SettingOption.BLOCK_WEBRTC]: boolean,
    [SettingOption.SELF_DESTRUCT_THIRD_PARTY_COOKIES]: boolean,
    [SettingOption.SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME]:number,
    [SettingOption.SELF_DESTRUCT_FIRST_PARTY_COOKIES]: boolean,
    [SettingOption.SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME]:number,
    [SettingOption.APPEARANCE_THEME]: AppearanceTheme,
    [SettingOption.USER_FILTER_ENABLED]: boolean,
    [SettingOption.HIDE_RATE_BLOCK]: boolean,
    [SettingOption.USER_RULES_EDITOR_WRAP]: boolean,
    [SettingOption.DISABLE_FILTERING]: boolean,
    [SettingOption.DISABLE_SHOW_PAGE_STATS]: boolean,
    [SettingOption.DISABLE_SHOW_CONTEXT_MENU]: boolean,

    [SettingOption.FILTERS_STATE_PROP]?: string,
    [SettingOption.FILTERS_VERSION_PROP]?: string,
    [SettingOption.GROUPS_STATE_PROP]?: string,

    [SettingOption.METADATA]?: string,
    [SettingOption.I18N_METADATA]?: string,

    [SettingOption.CUSTOM_FILTERS]?: string,

    [SettingOption.PAGE_STATISTIC]?: string,
};

// TODO: use setting import validation in settings service
// when filters service will be implemented
export const settingsValidator = z.object({
    'protocol-version': z.string(),
    'general-settings': z.object({
        'app-language': z.string().optional(),
        'allow-acceptable-ads': z.boolean(),
        'show-blocked-ads-count': z.boolean(),
        'autodetect-filters': z.boolean(),
        'safebrowsing-enabled': z.boolean(),
        'filters-update-period': z.any(),
        'appearance-theme': z.string().optional(),
    }),
    'extension-specific-settings': z.object({
        'use-optimized-filters': z.boolean(),
        'collect-hits-count': z.boolean(),
        'show-context-menu': z.boolean(),
        'show-info-about-adguard': z.boolean(),
        'show-app-updated-info': z.boolean(),
        'hide-rate-adguard': z.boolean(),
        'user-rules-editor-wrap': z.boolean(),
    }),
    filters: z.object({
        'enabled-groups': z.array(z.any()),
        'enabled-filters': z.array(z.any()),
        'custom-filters': z.array(z.any()),
        'user-filter': z.object({
            rules: z.string(),
            'disabled-rules': z.string(),
            enabled: z.boolean().optional(),
        }),
        whitelist: z.object({
            inverted: z.boolean(),
            domains: z.array(z.string()),
            'inverted-domains': z.array(z.string()),
            enabled: z.boolean().optional(),
        }),
    }),
    stealth: z
        .object({
            stealth_disable_stealth_mode: z.boolean(),
            'stealth-hide-referrer': z.boolean(),
            'stealth-hide-search-queries': z.boolean(),
            'stealth-send-do-not-track': z.boolean(),
            'stealth-block-webrtc': z.boolean(),
            'stealth-remove-x-client': z.boolean(),
            'stealth-block-third-party-cookies': z.boolean(),
            'stealth-block-third-party-cookies-time': z.number().optional(),
            'stealth-block-first-party-cookies': z.boolean(),
            'stealth-block-first-party-cookies-time': z.number().optional(),
            'block-known-trackers': z.boolean().optional(),
            'strip-tracking-parameters': z.boolean(),
        })
        .optional(),
});

// export type Settings = z.infer<typeof settingsValidator>;
