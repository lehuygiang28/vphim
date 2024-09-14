import { useEffect, useState } from 'react';

export function useCurrentUrl() {
    const [host, setHost] = useState('');
    const [params, setParams] = useState<{ [key: string]: string }>({});
    const [queryParams, setQueryParams] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setHost(window.location.origin);

            const pathParts = window.location.pathname.split('/').filter(Boolean);
            const pathParams: { [key: string]: string } = {};
            for (const [index, part] of pathParts.entries()) {
                if (index % 2 === 0 && pathParts[index + 1]) {
                    pathParams[decodeURIComponent(part)] = decodeURIComponent(pathParts[index + 1]);
                }
            }
            setParams(pathParams);

            const searchParams = new URLSearchParams(window.location.search);
            const parsedSearchParams: { [key: string]: string } = {};
            for (const [key, value] of searchParams) {
                parsedSearchParams[decodeURIComponent(key)] = decodeURIComponent(value);
            }
            setQueryParams(parsedSearchParams);
        }
    }, []);

    return { host, params, queryParams };
}
