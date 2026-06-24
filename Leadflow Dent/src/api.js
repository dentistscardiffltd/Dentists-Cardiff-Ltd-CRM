import { API_URL, APP_TOKEN } from "./config";

export async function apiGet(action, params = {}) {
  const query = new URLSearchParams({ action, token: APP_TOKEN, ...params }).toString();
  const res = await fetch(`${API_URL}?${query}`);
  const data = await res.json();
  if (data.status !== "success") throw new Error(data.message || "Request failed");
  return data;
}

export async function apiPost(action, payload = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    // text/plain avoids a CORS preflight that Apps Script web apps don't handle
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, token: APP_TOKEN, ...payload })
  });
  const data = await res.json();
  if (data.status !== "success") throw new Error(data.message || "Request failed");
  return data;
}

export function driveThumbnail(fileId, size = 800) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}

export function driveViewUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}
