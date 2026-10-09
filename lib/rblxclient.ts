import axios from "axios";

export const roblox = axios.create({
  baseURL: "https://apis.roblox.com",
  headers: {
    "x-api-key": process.env.RBX_APIKEY,
    "Content-Type": "application/json"
  },
});

roblox.interceptors.response.use(
  (response) => {
    delete response.config.headers['x-api-key'];
    return response
  },
  (error) => {
    delete error.config.headers['x-api-key'];
    throw error
  }
)

//<-- verificationApi/main/lib/rblxclient.ts -->