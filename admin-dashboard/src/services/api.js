import axios from 'axios';

// const API_URL = 'http://localhost:3000/api/v1';
const API_URL = 'https://aapada-backend.onrender.com/api/v1';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

export default api;
