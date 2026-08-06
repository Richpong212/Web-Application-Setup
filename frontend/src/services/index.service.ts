import axios from "axios";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5004";

// test route
export const test = async () => {
  const response = await axios.get(apiUrl);
  return response.data;
};
