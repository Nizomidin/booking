// src/api/services.js
import { request } from "./client";

export const listServices = (master_id) => {
  const qs = master_id ? `?master_id=${encodeURIComponent(master_id)}` : "";
  return request(`/services${qs}`);
};

export const createServices = (master_id, services) =>
  request(`/services?master_id=${encodeURIComponent(master_id)}`, {
    method: "POST",
    body: JSON.stringify(services),
  });

export const getService = (id) => request(`/services/${id}`);

export const putService = (id, data) =>
  request(`/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const patchService = (id, data) =>
  request(`/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteService = (id) =>
  request(`/services/${id}`, {
    method: "DELETE",
  });
