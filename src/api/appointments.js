import { request } from "./client";

export const listAppointments = () => request("/appointments");

export const createAppointment = (data) =>
  request("/appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getAppointment = (id) => request(`/appointments/${id}`);

export const putAppointment = (id, data) =>
  request(`/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const patchAppointment = (id, data) =>
  request(`/appointments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteAppointment = (id) =>
  request(`/appointments/${id}`, {
    method: "DELETE",
  });
