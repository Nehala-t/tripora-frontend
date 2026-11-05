import axios from "axios";

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  withCredentials: true,
});

console.log("AXIOS BASE URL:", api.defaults.baseURL);
export default api;