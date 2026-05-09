type OPhimResponse = {
    status: boolean;
    message?: string;
    msg?: string;
    data: {
        seoOnPage?: {
            og_type: string;
            titleHead: string;
            descriptionHead: string;
            og_image: string[];
            og_url: string;
        };
        breadCrumb?: {
            name: string;
            slug: string;
            isCurrent?: boolean;
            position: number;
        };
        titlePage?: string;
        type_list?: string;
        APP_DOMAIN_FRONTEND?: string;
        APP_DOMAIN_CDN_IMAGE?: string;
        params?: {
            type_slug: string;
            slug: string;
            filterCategory: string[];
            filterCountry: string[];
            filterYear: string;
            filterType: string;
            sortField: string;
            sortType: string;
            pagination: {
                totalItems: number;
                totalItemsPerPage: number;
                currentPage: number;
                totalPages: number;
            };
        };
    };
};

export type OPhimResponseSingle<T> = OPhimResponse & {
    data: {
        item: T;
    };
};

export type OPhimResponseList<T> = OPhimResponse & {
    data: {
        items: T[];
    };
};
