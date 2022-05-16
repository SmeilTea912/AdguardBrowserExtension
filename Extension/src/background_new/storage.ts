import browser from 'webextension-polyfill';

export class Storage {
    isInit = false;

    private storage = browser.storage.local;

    private data = {};

    async init() {
        this.data = await this.storage.get(null);

        this.isInit = true;
    }

    async set(key: string, value: unknown): Promise<void> {
        this.data[key] = value;
        await this.storage.set({ [key]: value });
    }

    get(key: string): unknown {
        if (!this.isInit) {
            throw new Error('The storage is not initialized');
        }

        return this.data[key];
    }

    async remove(key: string) {
        this.storage.remove(key);
    }
}

export const storage = new Storage();
