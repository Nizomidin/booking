import { request } from "./client";

export const listMasters = (telegram_id) => {
  const qs = telegram_id
    ? `?telegram_id=${encodeURIComponent(telegram_id)}`
    : "";
  return request(`/masters${qs}`);
};

export const createMaster = (data) =>
  request("/masters", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getMaster = (id) => request(`/masters/${id}`);

export const putMaster = (id, data) =>
  request(`/masters/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const patchMaster = (id, data) =>
  request(`/masters/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteMaster = (id) =>
  request(`/masters/${id}`, {
    method: "DELETE",
  });

export const checkAvailability = (id, date) =>
  request(`/masters/${id}/available?date=${date}`);

export const setWorkingHours = (id, schedule) =>
  request(`/masters/${id}/hours`, {
    method: "PUT",
    body: JSON.stringify(schedule),
  });

export const getWorkingHours = (id) => request(`/masters/${id}/hours`);
