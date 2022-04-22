import { TsWebExtension } from '@adguard/tswebextension';

export { TsWebExtension, MESSAGE_HANDLER_NAME as TS_WEB_EXTENSION_MESSAGE_HANDLER_NAME } from '@adguard/tswebextension';

export type { Message as TsWebExtensionMessage } from '@adguard/tswebextension';

export const tsWebExtension = new TsWebExtension('web-accessible-resources');

export const tsWebExtensionMessageHandler = tsWebExtension.getMessageHandler();
