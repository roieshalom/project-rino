"use client";
import { useAdmin } from "./AdminLock";

export default function UploaderPill({ name }) {
  const isAdmin = useAdmin();
  if (!isAdmin || !name) return null;
  return <span className="pill pill-uploader">{name}</span>;
}
