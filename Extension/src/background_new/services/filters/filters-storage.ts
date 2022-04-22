import { storage } from '../../storage';

export class FiltersStorage {
    static async set(filterId: number, filter: string[]): Promise<void> {
        const key = FiltersStorage.getFilterKey(filterId);

        await storage.set(key, filter);
    }

    static get(filterId: number): string[] {
        const key = FiltersStorage.getFilterKey(filterId);
        return storage.get(key) as string[];
    }

    static remove(filterId: number) {
        const key = FiltersStorage.getFilterKey(filterId);
        return storage.remove(key);
    }

    private static getFilterKey(filterId: number): string {
        return `filterrules_${filterId}.txt`;
    }
}
