import browser, { Events, Runtime } from 'webextension-polyfill';
import { Engine, EngineMessage } from './engine';

import {
    MessageType,
    Message,
    ExtractedMessage,
    APP_MESSAGE_HANDLER_NAME,
} from '../common/constants';

type MessageListener<T> = (message: T, sender: Runtime.MessageSender) => unknown;

export class MessageHandler {
  private messageListeners = new Map();

  constructor() {
      this.handleMessage = this.handleMessage.bind(this);
  }

  public init() {
      (browser.runtime.onMessage as Events.Event<MessageListener<Message>>).addListener(this.handleMessage);
  }

  public addListener<T extends MessageType>(type: T, listener: MessageListener<ExtractedMessage<T>>) {
      if (this.messageListeners.has(type)) {
          throw new Error(`${type} listener has already been registered`);
      }

      this.messageListeners.set(type, listener);
  }

  // TODO: runtime validation
  private handleMessage<T extends Message | EngineMessage>(message: T, sender: Runtime.MessageSender) {
      if (message.handlerName === Engine.messageHandlerName) {
          return Engine.messageHandler(message, sender);
      }

      if (message.handlerName === APP_MESSAGE_HANDLER_NAME) {
          console.log(message);
          const listener = this.messageListeners.get(message.type) as MessageListener<T>;
          if (listener) {
              return listener(message, sender);
          }
      }
  }
}

export const messageHandler = new MessageHandler();
