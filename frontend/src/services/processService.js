import API from "./api";

export const getProcesses = async () => {
  const response = await API.get("/processes");
  return response.data;
};

export const getProcessById = async (id) => {
  const response = await API.get(`/processes/${id}`);
  return response.data;
};

export const createProcess = async (data) => {
  const response = await API.post("/processes", data);
  return response.data;
};

export const updateProcess = async (id, data) => {
  const response = await API.put(`/processes/${id}`, data);
  return response.data;
};

export const deleteProcess = async (id) => {
  const response = await API.delete(`/processes/${id}`);
  return response.data;
};