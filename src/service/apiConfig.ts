// API base URL: development builds (Metro / Expo Go) use the test API, release builds production.
// The test server only answers over plain HTTP — its HTTPS handshake is reset — so dev uses http://.
const TEST_API_URL = 'http://myesseltestapi.esselprojects.com/api';
const PRODUCTION_API_URL = 'https://myesselapi.esselprojects.com/api';

const API_BASE_URL = __DEV__ ? TEST_API_URL : PRODUCTION_API_URL;

console.log('🔧 API_BASE_URL:', API_BASE_URL, __DEV__ ? '(development → test API)' : '(production)');

export { API_BASE_URL };
