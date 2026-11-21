import API from "./api";

export const getBrands = async () =>
  (await API.get("/brands")).data;

export const getBrandById = async (id) =>
  (await API.get(`/brands/${id}`)).data;

export const createBrand = async (data) =>
  (await API.post("/brands", data)).data;

export const updateBrand = async (id, data) =>
  (await API.put(`/brands/${id}`, data)).data;

export const deleteBrand = async (id) =>
  (await API.delete(`/brands/${id}`)).data;