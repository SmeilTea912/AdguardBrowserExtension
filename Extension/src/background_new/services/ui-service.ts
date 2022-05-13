import browser from 'webextension-polyfill';

import { messageHandler } from '../message-handler';
import { MessageType, OpenAbuseTabMessage, OpenSiteReportTabMessage } from '../../common/messages';
import { UserAgent } from '../../common/user-agent';
import { TabsApi } from '../extension-api/tabs';
import { Engine } from '../engine';
import { UrlUtils } from '../utils/url';
import { SettingsStorage } from './settings/settings-storage';
import { SettingOption } from '../../common/settings';

export class UiService {
    static baseUrl = browser.runtime.getURL('/');

    static settingsUrl = UiService.getExtensionPageUrl('options.html');

    static filteringLogUrl = UiService.getExtensionPageUrl('filtering-log.html');

    static init() {
        messageHandler.addListener(MessageType.OPEN_SETTINGS_TAB, UiService.openSettingsTab);
        messageHandler.addListener(MessageType.OPEN_FILTERING_LOG, UiService.openFilteringLog);
        messageHandler.addListener(MessageType.OPEN_ABUSE_TAB, UiService.openAbuseTab);
        messageHandler.addListener(MessageType.OPEN_SITE_REPORT_TAB, UiService.openSiteReportTab);
        messageHandler.addListener(MessageType.OPEN_ASSISTANT, UiService.openAssistant);
        messageHandler.addListener(MessageType.ADD_FILTERING_SUBSCRIPTION, UiService.openCustomFilterModal);
    }

    // listeners

    static async openSettingsTab(): Promise<void> {
        const settingTab = await TabsApi.findOne({ url: UiService.settingsUrl });

        if (settingTab) {
            await TabsApi.focus(settingTab);
        } else {
            await browser.tabs.create({ url: UiService.settingsUrl });
        }
    }

    static async openFilteringLog(): Promise<void> {
        const filteringLogTab = await TabsApi.findOne({ url: UiService.filteringLogUrl });

        if (filteringLogTab) {
            await TabsApi.focus(filteringLogTab);
        } else {
            await browser.windows.create({ url: UiService.filteringLogUrl, type: 'popup' });
        }
    }

    static async openAbuseTab({ data }: OpenAbuseTabMessage): Promise<void> {
        const { url } = data;

        let { browserName } = UserAgent;
        let browserDetails: string | undefined;

        if (!UserAgent.isSupportedBrowser) {
            browserDetails = browserName;
            browserName = 'Other';
        }

        const filterIds = Engine.api.configuration.filters.map(filter => filter.filterId);

        await browser.tabs.create({
            url: `https://reports.adguard.com/new_issue.html?product_type=Ext&product_version=${
                encodeURIComponent(browser.runtime.getManifest().version)
            }&browser=${encodeURIComponent(browserName)
            }${browserDetails ? `&browser_detail=${encodeURIComponent(browserDetails)}` : ''
            }&url=${encodeURIComponent(url)
            }${filterIds.length > 0 ? `&filters=${encodeURIComponent(filterIds.join('.'))}` : ''
            }${UiService.getStealthString(filterIds)
            }${UiService.getBrowserSecurityString()}`,
        });
    }

    static async openSiteReportTab({ data }: OpenSiteReportTabMessage): Promise<void> {
        const { url } = data;

        const domain = UrlUtils.getDomainName(url);

        if (!domain) {
            return;
        }

        const punycodeDomain = UrlUtils.toPunyCode(domain);

        await browser.tabs.create({
            // eslint-disable-next-line max-len
            url: `https://adguard.com/site.html?domain=${encodeURIComponent(punycodeDomain)}&utm_source=extension&aid=16593`,
        });
    }

    static async openAssistant(): Promise<void> {
        const activeTab = await TabsApi.findOne({ active: true });
        Engine.api.openAssistant(activeTab.id);
    }

    static async openCustomFilterModal(message): Promise<void> {
        const { url, title } = message.data;

        let path = 'options.html#filters?group=0';
        if (title) {
            path += `&title=${title}`;
        }
        path += `&subscribe=${encodeURIComponent(url)}`;

        const activeTab = await TabsApi.findOne({ url: UiService.getExtensionPageUrl(path) });

        if (activeTab) {
            await TabsApi.focus(activeTab);
        } else {
            await browser.tabs.create({ url: UiService.getExtensionPageUrl(path) });
        }
    }

    // helpers

    static getExtensionPageUrl(path: string) {
        return `${UiService.baseUrl}pages/${path}`;
    }

    static getBrowserSecurityString(): string {
        const isEnabled = !SettingsStorage.get(SettingOption.DISABLE_SAFEBROWSING);
        return `&browsing_security.enabled=${isEnabled}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static getStealthString(filterIds: number[]): string {
        const stealthEnabled = !SettingsStorage.get(SettingOption.DISABLE_STEALTH_MODE);

        if (!stealthEnabled) {
            return '&stealth.enabled=false';
        }
        const stealthOptions = [
            {
                queryKey: 'ext_hide_referrer',
                settingKey: SettingOption.HIDE_REFERRER,
            },
            {
                queryKey: 'hide_search_queries',
                settingKey: SettingOption.HIDE_SEARCH_QUERIES,
            },
            {
                queryKey: 'DNT',
                settingKey: SettingOption.SEND_DO_NOT_TRACK,
            },
            {
                queryKey: 'x_client',
                settingKey: SettingOption.BLOCK_CHROME_CLIENT_DATA,
            },
            {
                queryKey: 'webrtc',
                settingKey: SettingOption.BLOCK_WEBRTC,
            },
            {
                queryKey: 'third_party_cookies',
                settingKey: SettingOption.SELF_DESTRUCT_THIRD_PARTY_COOKIES,
                settingValueKey: SettingOption.SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME,
            },
            {
                queryKey: 'first_party_cookies',
                settingKey: SettingOption.SELF_DESTRUCT_FIRST_PARTY_COOKIES,
                settingValueKey: SettingOption.SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME,
            },
        ];

        const stealthOptionsString = stealthOptions.map((option) => {
            const { queryKey, settingKey, settingValueKey } = option;
            const setting = SettingsStorage.get(settingKey);
            let settingString: string;
            if (!setting) {
                return '';
            }
            if (!settingValueKey) {
                settingString = setting.toString();
            } else {
                settingString = SettingsStorage.get(settingValueKey).toString();
            }
            return `stealth.${queryKey}=${encodeURIComponent(settingString)}`;
        })
            .filter(string => string.length > 0)
            .join('&');

        // TODO: implement when filters service will be created)
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1937
        /*
        const isRemoveUrlParamsEnabled = filterIds.includes(AntiBannerFiltersId.URL_TRACKING_FILTER_ID);
        if (isRemoveUrlParamsEnabled) {
            stealthOptionsString = `${stealthOptionsString}&stealth.strip_url=true`;
        }
        */

        return `&stealth.enabled=true&${stealthOptionsString}`;
    }
}
