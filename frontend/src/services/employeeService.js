import API from "./api";

// Get all employees
export const getEmployees = async () => {
  const response = await API.get("/employees");
  return response.data;
};

// Get employee by ID
export const getEmployeeById = async (id) => {
  const response = await API.get(`/employees/${id}`);
  return response.data;
};

// Add employee
export const createEmployee = async (employeeData) => {
  const response = await API.post("/employees", employeeData);
  return response.data;
};

// Update employee
export const updateEmployee = async (id, employeeData) => {
  const response = await API.put(`/employees/${id}`, employeeData);
  return response.data;
};

// Delete employee (deactivate)
export const deleteEmployee = async (id) => {
  const response = await API.delete(`/employees/${id}`);
  return response.data;
};