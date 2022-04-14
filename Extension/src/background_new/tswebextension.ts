import {
    TsWebExtension,
    ManifestV2AppInterface,
    Configuration,
} from '@adguard/tswebextension';
import merge from 'deepmerge';
import { SettingOption } from '../common/settings';
import { settingsStorage } from './services/settings/settings-storage';

export { MESSAGE_HANDLER_NAME as TS_WEB_EXTENSION_MESSAGE_HANDLER_NAME } from '@adguard/tswebextension';

export type { Message as TsWebExtensionMessage } from '@adguard/tswebextension';

const tsWebExtension = new TsWebExtension('web-accessible-resources');
export class TsWebExtensionWrapper {
  static defaultConfig: Configuration = {
      filters: [],
      allowlist: [],
      userrules: [],
      verbose: false,
      settings: {
          collectStats: !settingsStorage.get(SettingOption.DISABLE_COLLECT_HITS),
          allowlistInverted: !settingsStorage.get(SettingOption.DEFAULT_ALLOWLIST_MODE),
          stealth: {
              blockChromeClientData: settingsStorage.get(SettingOption.BLOCK_CHROME_CLIENT_DATA),
              hideReferrer: settingsStorage.get(SettingOption.HIDE_REFERRER),
              hideSearchQueries: settingsStorage.get(SettingOption.HIDE_SEARCH_QUERIES),
              sendDoNotTrack: settingsStorage.get(SettingOption.SEND_DO_NOT_TRACK),
              blockWebRTC: settingsStorage.get(SettingOption.BLOCK_WEBRTC),
              selfDestructThirdPartyCookies: settingsStorage.get(
                  SettingOption.SELF_DESTRUCT_THIRD_PARTY_COOKIES,
              ),
              selfDestructThirdPartyCookiesTime: settingsStorage.get(
                  SettingOption.SELF_DESTRUCT_THIRD_PARTY_COOKIES_TIME,
              ),
              selfDestructFirstPartyCookies: settingsStorage.get(
                  SettingOption.SELF_DESTRUCT_FIRST_PARTY_COOKIES,
              ),
              selfDestructFirstPartyCookiesTime: settingsStorage.get(
                  SettingOption.SELF_DESTRUCT_FIRST_PARTY_COOKIES_TIME,
              ),
          },
      },
  };

  public config = TsWebExtensionWrapper.defaultConfig;

  public tsWebExtension: ManifestV2AppInterface;

  constructor(tsWebExtension: ManifestV2AppInterface) {
      this.tsWebExtension = tsWebExtension;
  }

  async start(config: Partial<Configuration>): Promise<void> {
      const nextConfig = TsWebExtensionWrapper.mergeConfig(
          TsWebExtensionWrapper.defaultConfig,
          config,
      );

      await this.tsWebExtension.start(nextConfig);

      this.config = nextConfig;
  }

  async stop(): Promise<void> {
      await this.tsWebExtension.stop();
  }

  async configure(config: Partial<Configuration>): Promise<void> {
      const nextConfig = TsWebExtensionWrapper.mergeConfig(this.config, config);

      await this.tsWebExtension.configure(nextConfig);

      this.config = nextConfig;
  }

  getRulesCount(): number {
      return this.tsWebExtension.getRulesCount();
  }

  private static mergeConfig(
      target: Configuration,
      source: Partial<Configuration>,
  ) {
      return merge<Configuration>(target, source, {
          arrayMerge: (_, source) => source,
      });
  }
}

export const tsWebExtensionWrapper = new TsWebExtensionWrapper(tsWebExtension);

export const TsWebExtensionHandler = tsWebExtension.getMessageHandler();
