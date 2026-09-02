import axios from 'axios';

function createApiClient(baseURL){
    const client  = axios.create({baseURL});

    client.interceptors.request.use((config)=>{
        const token = localStorage.getItem('token');
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });


    client.interceptors.response.use(
        (response) => response,
        (error)=>{
            const data = error.response?.data;

            let message = 'Something went wrong.Please Try again.';

            if(typeof data === 'string'){
                message = data;
            }else if(data?.error){
                message = data.error;
            }else if(data && typeof data === 'object'){
                message = Object.values(data).join(', ');
            }
            
            console.error(`[API Error] ${error.config?.url} ->`, message);

            return Promise.reject({
                message,
                status: error.response?.status,
                raw: data,
            });
        }
    );

    return client;
}

export const userClient = createApiClient(import.meta.env.VITE_USER_SERVICE_URL);
export const orderClient = createApiClient(import.meta.env.VITE_ORDER_SERVICE_URL);
export const paymentClient = createApiClient(import.meta.env.VITE_PAYMENT_SERVICE_URL);