import browser, { WebNavigation } from 'webextension-polyfill';
import { RequestType } from '@adguard/tsurlfilter';
import { FrameRequestService, tabsApi } from '@adguard/tswebextension';
import {
    BACKGROUND_TAB_ID,
    MessageType,
} from '../../../../common/constants';
import { CustomFilterApi } from './api';
import { filtersState } from '../filters-state';
import { messageHandler } from '../../../message-handler';
import { Engine } from '../../../engine';

export class CustomFilterService {
    static async init() {
        messageHandler.addListener(MessageType.LOAD_CUSTOM_FILTER_INFO, CustomFilterService.onCustomFilterInfoLoad);
        messageHandler.addListener(
            MessageType.SUBSCRIBE_TO_CUSTOM_FILTER,
            CustomFilterService.onCustomFilterSubscribtion,
        );
        messageHandler.addListener(MessageType.REMOVE_ANTIBANNER_FILTER, CustomFilterService.onCustomFilterRemove);

        browser.webNavigation.onCommitted.addListener(CustomFilterService.onTabCommited);
    }

    static async onCustomFilterInfoLoad(message) {
        const { url, title } = message.data;

        return CustomFilterApi.getCustomFilterInfo(url, title);
    }

    static async onCustomFilterSubscribtion(message) {
        const { filter } = message.data;

        const { customUrl, name, trusted } = filter;

        const filterMetadata = await CustomFilterApi.createCustomFilter(customUrl, { name, trusted });

        await filtersState.enableFilters([filterMetadata.filterId]);

        await Engine.update();

        return filterMetadata;
    }

    static async onCustomFilterRemove(message) {
        const { filterId } = message.data;

        await CustomFilterApi.removeCustomFilter(filterId);
    }

    static onTabCommited(details: WebNavigation.OnCommittedDetailsType) {
        const { tabId, frameId } = details;

        if (tabId === BACKGROUND_TAB_ID) {
            return;
        }

        const frame = tabsApi.getTabFrame(tabId, frameId);

        if (!frame?.url) {
            return;
        }

        const requestSearchParams = FrameRequestService.prepareSearchParams(frame.url, tabId, frameId);
        const requestContext = FrameRequestService.search(requestSearchParams);

        if (!requestContext) {
            return;
        }

        const { requestType } = requestContext;

        if (requestType !== RequestType.Document && requestType !== RequestType.Subdocument) {
            return;
        }

        browser.tabs.executeScript(tabId, {
            file: '/content-script/subscribe.js',
            runAt: 'document_start',
            frameId,
        });
    }
}
