/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    TagMetadata,
    FilterMetadata,
    GroupMetadata,
} from './metadata';

/**
 * Metadata factory
 */
export class MetadataFactory {
    /**
     * Create tag from object
     *
     * @param tag Object
     * @returns {FilterTag}
     */
    public static createFilterTagFromJSON(tag: any): TagMetadata {
        const tagId = Number.parseInt(tag.tagId, 10);
        const { keyword } = tag;

        return { tagId, keyword };
    }

    /**
     * Create group from object
     *
     * @param group Object
     * @returns {SubscriptionGroup}
     */
    public static createSubscriptionGroupFromJSON(group: any): GroupMetadata {
        const groupId = Number.parseInt(group.groupId, 10);
        const groupName = String(group.groupName);
        const displayNumber = Number.parseInt(group.displayNumber, 10);

        return {
            groupId,
            groupName,
            displayNumber,
        };
    }

    /**
     * Create filter from object
     *
     * @param filter Object
     */
    public static createSubscriptionFilterFromJSON(filter: any): FilterMetadata {
        const filterId = Number.parseInt(filter.filterId, 10);
        const groupId = Number.parseInt(filter.groupId, 10);
        const timeUpdated = MetadataFactory.parseTimeUpdated(filter.timeUpdated);
        const expires = Number.parseInt(filter.expires, 10);
        const displayNumber = Number.parseInt(filter.displayNumber, 10);

        const {
            name, description, homepage, version, subscriptionUrl, languages, tags, customUrl, trusted, checksum,
        } = filter;

        if (tags.length === 0) {
            tags.push(0);
        }

        return {
            filterId,
            groupId,
            name,
            description,
            homepage,
            version,
            timeUpdated,
            displayNumber,
            languages: languages || [],
            expires,
            subscriptionUrl,
            tags,
            customUrl,
            trusted,
            checksum,
        };
    }

    /**
     * Parses string to date
     *
     * @param timeUpdatedString String in format 'yyyy-MM-dd'T'HH:mm:ssZ'
     * @returns number from date string
     */
    private static parseTimeUpdated(timeUpdatedString: string): number {
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1272
        if (Number.isInteger(timeUpdatedString)) {
            return new Date(timeUpdatedString).getTime();
        }

        // https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
        let timeUpdated = Date.parse(timeUpdatedString);
        if (Number.isNaN(timeUpdated)) {
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/478
            timeUpdated = Date.parse(timeUpdatedString.replace(/\+(\d{2})(\d{2})$/, '+$1:$2'));
        }
        if (Number.isNaN(timeUpdated)) {
            timeUpdated = new Date().getTime();
        }
        return timeUpdated;
    }
}
