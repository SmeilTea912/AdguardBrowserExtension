/* eslint-disable @typescript-eslint/no-explicit-any */
import { log } from '../../../common/log';
import { networkService } from '../network/network-service';
import { SettingOption } from '../../../common/settings';
import { SettingsStorage } from '../settings/settings-storage';

export class I18nMetadataStorage {
    data = {
        filters: {},
        groups: {},
        tags: {},
    };

    /**
     * Parse i18n metadata from local storage
     */
    async init(): Promise<void> {
        log.info('Initialize i18n metadata');

        const storageData = SettingsStorage.get(SettingOption.I18N_METADATA);

        if (storageData) {
            this.data = JSON.parse(storageData);
        } else {
            this.data = await networkService.getLocalFiltersI18nMetadata();
        }

        await this.updateStorageData();

        log.info('I18n metadata storage successfully initialize');
    }

    /**
     * Load metadata from external source
     * @param remote - is metadata loaded from backend
     */
    async loadMetadata(remote: boolean) {
        log.info('Loading metadata');

        this.data = remote
            ? await networkService.downloadI18nMetadataFromBackend()
            : await networkService.getLocalFiltersI18nMetadata();

        await this.updateStorageData();
        log.info('Filters metadata loaded from backend');
    }

    private async updateStorageData(): Promise<void> {
        SettingsStorage.set(SettingOption.I18N_METADATA, JSON.stringify(this.data));
    }
}

export const i18nMetadataStorage = new I18nMetadataStorage();
