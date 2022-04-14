import {
    TsWebExtension,
    Configuration,
} from '@adguard/tswebextension';
import merge from 'deepmerge';

export { MESSAGE_HANDLER_NAME as TS_WEB_EXTENSION_MESSAGE_HANDLER_NAME } from '@adguard/tswebextension';

export type { Message as TsWebExtensionMessage } from '@adguard/tswebextension';

export const tsWebExtension = new TsWebExtension('web-accessible-resources');

export const tsWebExtensionMessageHandler = tsWebExtension.getMessageHandler();

export function mergeConfig(
    target: Configuration,
    source: Partial<Configuration>,
) {
    return merge<Configuration>(target, source, {
        arrayMerge: (_, source) => source,
    });
}
