export interface FilterMetadata {
    filterId: number,
    groupId: number,
    name: string,
    description: string,
    homepage: string,
    version: string,
    // TODO: to one type
    timeUpdated: string | number,
    // TODO: to one type
    expires: string | number,
    subscriptionUrl: string,
    tags: number[],

    // custom filter metadata
    customUrl?: string,
    trusted?: boolean,
    checksum?: string,

    // TODO: need strict?
    lastCheckTime?: number,
    lastUpdateTime?: number,
    displayNumber?: number,
    languages?: string[],
    rulesCount?: boolean,
    installed?: boolean,
    loaded?: boolean,
    enabled?: boolean,
    removed?: boolean,
    tagsDetails?: any,
}

export interface GroupMetadata {
     groupId: number,
     groupName: string,
     displayNumber: number,

     // TODO: need strict?
    enabled?: boolean
    filters?: FilterMetadata[]
}

export interface TagMetadata {
    tagId: number,
    keyword: string,
}
