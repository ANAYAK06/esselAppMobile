// Update your API config with more logging
const getLocalIP = () => {
    const url = 'https://myesselapi.esselprojects.com/api';
    console.log('🌐 API_BASE_URL set to:', url);
    return url;
};

const API_BASE_URL = __DEV__
    ? getLocalIP()
    : 'https://myesselapi.esselprojects.com/api';

console.log('🔧 Final API_BASE_URL:', API_BASE_URL);
console.log('🔧 Development mode:', __DEV__);

export { API_BASE_URL };