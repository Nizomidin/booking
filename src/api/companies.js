import { request } from "./client";

export const listCompanies = () => request("/companies");

export const createCompany = (data) =>
  request("/companies", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getCompany = (id) => request(`/companies/${id}`);

export const putCompany = (id, data) =>
  request(`/companies/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const patchCompany = (id, data) =>
  request(`/companies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteCompany = (id) =>
  request(`/companies/${id}`, {
    method: "DELETE",
  });
