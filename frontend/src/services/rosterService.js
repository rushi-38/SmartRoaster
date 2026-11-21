import API from "./api";

// Get all generated rosters
export const getRosters = async () => {
  const response = await API.get("/rosters");
  return response.data;
};

// Get roster by month and year
export const getRosterByMonth = async (year, month) => {
  const response = await API.get(`/rosters/${year}/${month}`);
  return response.data;
};

// Generate monthly roster
export const generateMonthlyRoster = async (month, year) => {
  const response = await API.post("/rosters/generate", {
    month,
    year,
  });

  return response.data;
};

// Delete a roster
export const deleteRoster = async (id) => {
  const response = await API.delete(`/rosters/${id}`);
  return response.data;
};