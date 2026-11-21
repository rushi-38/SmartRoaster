import API from "./api";

export const getPods = async () => {
  const response = await API.get("/pods");
  return response.data;
};

export const createPod = async (podData) => {
  const response = await API.post("/pods", podData);
  return response.data;
};

export const updatePod = async (id, podData) => {
  const response = await API.put(`/pods/${id}`, podData);
  return response.data;
};

export const deletePod = async (id) => {
  const response = await API.delete(`/pods/${id}`);
  return response.data;
};