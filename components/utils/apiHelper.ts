import axios, { AxiosRequestConfig } from 'axios';

const withAuth = (headers: Record<string, string> = {}): Record<string, string> => {
    const accessToken = localStorage.getItem('userToken');
    const authToken = localStorage.getItem('auth_token');
    
    // Use auth_token (Bearer) if available, otherwise fall back to userToken (Token)
    const token = authToken || accessToken;
    const tokenType = authToken ? 'Bearer' : 'Token';
    
    return {
        ...headers,
        'Content-Type': 'application/json',
        Authorization: token ? `${tokenType} ${token}` : ''
    };
};

const base = (method: string, url: string, data: any = {}, headers: Record<string, string> = {}, params: Record<string, any> = {}, secure: boolean = false, responseType: AxiosRequestConfig['responseType'] = 'json') => {
    console.log(`Making ${method.toUpperCase()} request to:`, url);
    console.log('Secure request:', secure);
    
    if (secure) {
        return axios({
            method,
            url,
            data,
            headers: withAuth(headers),
            params,
            responseType
        }).then((response) => {
            console.log(`Response received: ${response.status} for ${url}`);
            return response;
        }).catch((err) => {
            console.error(`API Error for ${url}:`, err.response?.status, err.response?.data);
            console.error('Full error:', err);
            if (err.response?.status === 401) {
                // Clear auth tokens on 401
                localStorage.removeItem('auth_token');
                localStorage.removeItem('userToken');
                localStorage.removeItem('user');
                // Redirect to login if we're not already there
                if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
            throw err;
        });
    } else {
        return axios({
            method,
            url,
            data,
            headers: withAuth(headers),
            params,
            responseType
        }).then((response) => {
            console.log(`Response received: ${response.status} for ${url}`);
            return response;
        }).catch((err) => {
            console.error(`API Error for ${url}:`, err.response?.status, err.response?.data);
            throw err;
        });
    }
};

const ApiHelper: Record<string, Function> = {};

const methods: string[] = ['get', 'post', 'put', 'patch', 'delete'];

methods.forEach((method) => {
    ApiHelper[method] = base.bind(null, method);
});

export default ApiHelper;