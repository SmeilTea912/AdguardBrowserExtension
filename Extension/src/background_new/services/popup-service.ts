import {
    defaultFilteringLog,
    FilteringEventType,
    BlockRequestEvent,
    tabsApi,
    isHttpRequest,
    getHost,
} from '@adguard/tswebextension';
import { MessageType } from '../../common/messages';
import { messageHandler } from '../message-handler';
import { settingsStorage } from './settings/settings-storage';
import { pageStats } from './filters/page-stats';
import stubData from './popup-stub-data.json';
import { SettingOption } from '../../common/settings';
import { AntiBannerFiltersId } from '../../common/constants';
import { UserAgent } from '../../common/user-agent';

export class PopupService {
    static init() {
        messageHandler.addListener(MessageType.GET_TAB_INFO_FOR_POPUP, PopupService.getTabInfoForPopup);

        defaultFilteringLog.addEventListener(FilteringEventType.BLOCK_REQUEST, PopupService.onRequestBlock);
    }

    static async getTabInfoForPopup({ data }) {
        const { tabId } = data;

        return {
            frameInfo: PopupService.getMainFrameInfo(tabId),
            stats: settingsStorage.isInit ? (await pageStats.getStatisticsData()) : {},
            settings: settingsStorage.getData(),
            options: {
                showStatsSupported: true,
                isFirefoxBrowser: UserAgent.isFirefox,
                showInfoAboutFullVersion: !settingsStorage.get(SettingOption.DISABLE_SHOW_ADGUARD_PROMO_INFO),
                isMacOs: UserAgent.isMacOs,
                isEdgeBrowser: UserAgent.isEdge, // TODO: Edge chromium
                notification: null, // TODO
                isDisableShowAdguardPromoInfo: settingsStorage.get(SettingOption.DISABLE_SHOW_ADGUARD_PROMO_INFO),
                hasCustomRulesToReset: false, // TODO,
            },
        };
    }

    static async onRequestBlock({ data }: BlockRequestEvent) {
        const { filterId } = data;

        const blockedCountIncrement = 1;

        await pageStats.updateStats(filterId, blockedCountIncrement, new Date());
        await pageStats.updateTotalBlocked(blockedCountIncrement);
    }

    /**
    * Gets main frame popup data
    */
    private static getMainFrameInfo(tabId: number) {
        const tabContext = tabsApi.getTabContext(tabId);

        const { frames, metadata } = tabContext;

        const { blockedRequestCount, mainFrameRule } = metadata;

        const mainFrame = frames.get(0);

        const { url } = mainFrame;

        const urlFilteringDisabled = !isHttpRequest(url);

        // TODO: check storage init ?
        // application is available for tabs where url is with http schema
        const applicationAvailable = urlFilteringDisabled;

        let documentAllowlisted = false;
        let userAllowlisted = false;
        let canAddRemoveRule = false;
        let frameRule;

        const adguardProductName = '';

        const totalBlocked = pageStats.getTotalBlocked();

        const totalBlockedTab = blockedRequestCount || 0;
        const applicationFilteringDisabled = settingsStorage.get(SettingOption.DISABLE_FILTERING);

        if (applicationAvailable) {
            documentAllowlisted = !!mainFrameRule && mainFrameRule.isAllowlist();
            if (documentAllowlisted) {
                const rule = mainFrameRule;

                const filterId = rule.getFilterListId();

                userAllowlisted = filterId === AntiBannerFiltersId.USER_FILTER_ID
                       || filterId === AntiBannerFiltersId.ALLOWLIST_FILTER_ID;

                frameRule = {
                    filterId,
                    ruleText: rule.getText(),
                };
            }
            // It means site in exception
            canAddRemoveRule = !(documentAllowlisted && !userAllowlisted);
        }

        const domainName = getHost(url);

        return {
            url,
            applicationAvailable,
            domainName,
            applicationFilteringDisabled,
            urlFilteringDisabled,
            documentAllowlisted,
            userAllowlisted,
            canAddRemoveRule,
            frameRule,
            adguardProductName,
            totalBlockedTab,
            totalBlocked,
        };
    }
}
