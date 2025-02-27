import axios from "axios";

const api_url = process.env.REACT_APP_API_URL;
console.log(api_url);

// test route
export const test = async () => {
  const response = await axios.get(`${api_url}`);
  return response.data;
};
