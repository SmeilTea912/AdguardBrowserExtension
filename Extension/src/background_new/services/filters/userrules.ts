import { FiltersStorage } from './filters-storage';
import {
    AntiBannerFiltersId,
} from '../../../common/constants';

export class Userrules {
    static async init() {
        const userRules = FiltersStorage.get(AntiBannerFiltersId.USER_FILTER_ID);

        if (!userRules) {
            await FiltersStorage.set(AntiBannerFiltersId.USER_FILTER_ID, []);
        }
    }
}
