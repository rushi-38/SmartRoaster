import API from "./api";

export const getReport = async (month, year) => {
  const response = await API.get("/reports", {
    params: { month, year },
  });

  return response.data;
};