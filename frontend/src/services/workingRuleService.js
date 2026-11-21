import API from "./api";

export const getWorkingRules = async () => {
  const response = await API.get("/working-rules");
  return response.data;
};

export const getWorkingRuleById = async (id) => {
  const response = await API.get(`/working-rules/${id}`);
  return response.data;
};

export const createWorkingRule = async (data) => {
  const response = await API.post("/working-rules", data);
  return response.data;
};

export const updateWorkingRule = async (id, data) => {
  const response = await API.put(`/working-rules/${id}`, data);
  return response.data;
};

export const deleteWorkingRule = async (id) => {
  const response = await API.delete(`/working-rules/${id}`);
  return response.data;
};
