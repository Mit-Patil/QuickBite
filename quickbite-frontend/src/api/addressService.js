import { userClient } from './axiosClient';

export function getAddress(){
    return userClient.get('/api/users/me/addresses');
}

export function addAddress(data){
    return userClient.post('/api/users/me/addresses',data);
}

export function updateAddress(id, data){
    return userClient.put(`/api/users/me/addresses/${id}`, data);
}

export function deleteAddress(id){
    return userClient.delete(`/api/users/me/addresses/${id}`);
}