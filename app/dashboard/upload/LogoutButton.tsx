"use client";

import { useState } from "react";
import { url } from "../../../lib/url";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch(url("/api/auth/logout"), { method: "POST" });
    window.location.href = url("/login");
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
