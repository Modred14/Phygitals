"use client";
export async function adminApi(path, { method = "GET", body } = {}) {
  const res = await fetch(path, { method, credentials: "same-origin", headers: { "Content-Type": "application/json", "x-requested-with": "admin-ui" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? "request_failed"), { status: res.status, data });
  return data;
}
