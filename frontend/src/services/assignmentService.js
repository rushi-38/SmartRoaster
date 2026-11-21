import API from "./api";

export const getAssignments = async () => {
  const response = await API.get("/assignments");
  return response.data;
};

export const getAssignmentById = async (id) => {
  const response = await API.get(`/assignments/${id}`);
  return response.data;
};

export const createAssignment = async (data) => {
  const response = await API.post("/assignments", data);
  return response.data;
};

export const updateAssignment = async (id, data) => {
  const response = await API.put(`/assignments/${id}`, data);
  return response.data;
};

export const deleteAssignment = async (id) => {
  const response = await API.delete(`/assignments/${id}`);
  return response.data;
};