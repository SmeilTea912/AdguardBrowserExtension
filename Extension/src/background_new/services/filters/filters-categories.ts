/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */
import { metadata } from './metadata';
import { filtersState } from './filters-state';
import { groupsState } from './groups-state';

export class Categories {
    static getFiltersMetadata() {
        const groups = Categories.getGroups();
        const filters = Categories.getFilters();

        const categories = [];

        for (let i = 0; i < groups.length; i += 1) {
            const category = groups[i];
            category.filters = Categories.selectFiltersByGroupId(category.groupId, filters);
            categories.push(category);
        }

        return {
            filters,
            categories,
        };
    }

    private static getTagsDetails(tagsIds: number[]) {
        const tagsMetadata = metadata.getTags();

        const tagsDetails = [];

        for (let i = 0; i < tagsIds.length; i += 1) {
            const tagId = tagsIds[i];

            const tagDetails = tagsMetadata.find(tag => tag.tagId === tagId);

            if (tagDetails) {
                if (tagDetails.keyword.startsWith('reference:')) {
                    // Hide 'reference:' tags
                    continue;
                }

                if (!tagDetails.keyword.startsWith('lang:')) {
                    // Hide prefixes except of 'lang:'
                    tagDetails.keyword = tagDetails.keyword.substring(tagDetails.keyword.indexOf(':') + 1);
                }

                tagsDetails.push(tagDetails);
            }
        }

        return tagsDetails;
    }

    private static getFilters() {
        const filtersMetadata = metadata.getFilters();

        const result = [];

        for (let i = 0; i < filtersMetadata.length; i += 1) {
            const filterMetadata = filtersMetadata[i];

            const tagsIds = filterMetadata.tags;

            const tagsDetails = Categories.getTagsDetails(tagsIds);

            const filterState = filtersState.get(filterMetadata.filterId);

            result.push({
                ...filterMetadata,
                ...filterState,
                tagsDetails,
            });
        }

        return result;
    }

    private static getGroups() {
        const groupsMetadata = metadata.getGroups();

        const result = [];

        for (let i = 0; i < groupsMetadata.length; i += 1) {
            const groupMetadata = groupsMetadata[i];

            const groupState = groupsState.get(groupMetadata.groupId);

            result.push({
                ...groupMetadata,
                ...groupState,
            });
        }

        return result;
    }

    private static selectFiltersByGroupId(groupId: number, filters) {
        return filters.filter(filter => filter.groupId === groupId);
    }
}
