import API from "./api";

export const getLeaves = async () => {
  return (await API.get("/leaves")).data;
};

export const getLeaveById = async (id) => {
  return (await API.get(`/leaves/${id}`)).data;
};

export const createLeave = async (data) => {
  return (await API.post("/leaves", data)).data;
};

export const updateLeaveStatus = async (id, status) => {
  return (await API.patch(`/leaves/${id}/status`, { status })).data;
};

export const deleteLeave = async (id) => {
  return (await API.delete(`/leaves/${id}`)).data;
};

export const toBackendLeaveType = (type) => {
  const types = {
    "Planned Leave": "Annual",
    "Sick Leave": "Sick",
    "Comp-Off": "CompOff",
  };

  return types[type] || type;
};

export const toFrontendLeaveType = (type) => {
  const types = {
    Annual: "Planned Leave",
    Sick: "Sick Leave",
    CompOff: "Comp-Off",
  };

  return types[type] || type;
};