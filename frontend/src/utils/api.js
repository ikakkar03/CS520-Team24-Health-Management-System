import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.API_BASE || "http://localhost:5001/api",
  headers: { "Content-Type": "application/json" },
});

instance.setToken = (token) => {
  if (token) instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete instance.defaults.headers.common["Authorization"];
};

export default instance;