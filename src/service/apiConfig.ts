const getLocalIP = () => {
    if (__DEV__) {
        // Replace with your actual development machine IP
        return 'http://esseltestapi.esselprojects.com/api';
    }
    return 'http://esseltestapi.esselprojects.com/api';
};

const API_BASE_URL = __DEV__
    ? getLocalIP()
    : `http://myesselapi.esselprojects.com/api`;

export { API_BASE_URL };