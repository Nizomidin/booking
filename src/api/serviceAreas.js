import { request } from "./client";

export const listServiceAreas = () => request("/service-areas");

export const createServiceArea = (area) =>
  request("/service-areas", {
    method: "POST",
    body: JSON.stringify(area),
  });

export const getServiceArea = (id) => request(`/service-areas/${id}`);

export const putServiceArea = (id, data) =>
  request(`/service-areas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const patchServiceArea = (id, data) =>
  request(`/service-areas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteServiceArea = (id) =>
  request(`/service-areas/${id}`, {
    method: "DELETE",
  });
