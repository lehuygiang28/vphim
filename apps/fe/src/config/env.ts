import getConfig from 'next/config';

// Get the runtime configuration
const { publicRuntimeConfig } = getConfig();

// Extract the API URL from the runtime configuration
export const baseApiUrl = publicRuntimeConfig.apiUrl as string;
