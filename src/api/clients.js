// src/api/clients.js
import { request } from "./client";

export const listClients = (telegram_id) => {
  const qs = telegram_id
    ? `?telegram_id=${encodeURIComponent(telegram_id)}`
    : "";
  return request(`/clients${qs}`);
};

export const createClient = (data) =>
  request("/clients", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getClient = (id) => request(`/clients/${id}`);

export const putClient = (id, data) =>
  request(`/clients/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const patchClient = (id, data) =>
  request(`/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteClient = (id) =>
  request(`/clients/${id}`, {
    method: "DELETE",
  });
