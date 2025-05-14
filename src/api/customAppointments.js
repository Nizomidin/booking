import { request } from "./client";

export const listCustomAppointments = () => request("/custom_appointments");

export const createCustomAppointment = (data) =>
  request("/custom_appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getCustomAppointment = (id) =>
  request(`/custom_appointments/${id}`);

export const updateCustomAppointment = (id, data) =>
  request(`/custom_appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const patchCustomAppointment = (id, data) =>
  request(`/custom_appointments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteCustomAppointment = (id) =>
  request(`/custom_appointments/${id}`, {
    method: "DELETE",
  });
