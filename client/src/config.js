const localApiUrl = "http://localhost:8000";

export const API_URL = process.env.REACT_APP_API_URL || localApiUrl;

export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || API_URL;
