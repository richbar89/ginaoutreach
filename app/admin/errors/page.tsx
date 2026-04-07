"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCheck, Trash2 } from "lucide-react";

type ErrorLog = {
  id: string;
  message: string;
  context: Record<string, unknown> | null;
  user_id: string | null;
  level: "error" | "warn" | "info";
  path: string | null;
  resolved: boolean;
  created_at: string;
};

const LEVEL_COLOURS: Record<string, string> = {
  error: "bg-red-100 text-red-700",
  warn:  "bg-amber-100 text-amber-700",
  info:  "bg-blue-100 text-blue-700",
};

export default function AdminErrorsPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unresolved">("unresolved");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/errors");
    const data = await res.json();
    setErrors(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resolve = async (id: string) => {
    await fetch("/api/admin/errors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolved: true }),
    });
    setErrors(prev => prev.map(e => e.id === id ? { ...e, resolved: true } : e));
  };

  const resolveAll = async () => {
    await fetch("/api/admin/errors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: true }),
    });
    await load();
  };

  const clearResolved = async () => {
    await fetch("/api/admin/errors", { method: "DELETE" });
    await load();
  };

  const displayed = filter === "unresolved" ? errors.filter(e => !e.resolved) : errors;

  return (
    <div className="h-full flex flex-col overflow-y-auto p-8" style={{ background: "var(--blush)" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-navy-400 hover:text-navy-700"><ArrowLeft size={18} /></Link>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Admin</p>
            <h1 className="text-2xl font-black text-navy-900">Error Log</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resolveAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl hover:border-coral-300 text-navy-600"
          >
            <CheckCheck size={13} /> Resolve all
          </button>
          <button
            onClick={clearResolved}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl hover:border-red-300 text-red-500"
          >
            <Trash2 size={13} /> Clear resolved
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {(["unresolved", "all"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
              filter === f ? "bg-coral-500 text-white" : "bg-white text-navy-500 border border-gray-200"
            }`}
          >
            {f} ({f === "unresolved" ? errors.filter(e => !e.resolved).length : errors.length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-navy-400 text-sm py-10">Loading…</div>
      ) : displayed.length === 0 ? (
        <div className="text-center text-navy-400 text-sm py-10">No errors. All clear.</div>
      ) : (
        <div className="space-y-2">
          {displayed.map(err => (
            <div
              key={err.id}
              className={`bg-white rounded-2xl border p-4 ${err.resolved ? "opacity-50" : ""}`}
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-start gap-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${LEVEL_COLOURS[err.level]}`}>
                  {err.level}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-navy-900 mb-1">{err.message}</p>
                  {err.path && <p className="text-xs text-navy-400 mb-1">Path: {err.path}</p>}
                  {err.context && (
                    <pre className="text-[10px] bg-gray-50 rounded-lg p-2 overflow-x-auto text-navy-500 mt-1">
                      {JSON.stringify(err.context, null, 2)}
                    </pre>
                  )}
                  <p className="text-[11px] text-navy-300 mt-1">
                    {new Date(err.created_at).toLocaleString("en-GB")}
                    {err.user_id && ` · user: ${err.user_id.slice(0, 8)}…`}
                  </p>
                </div>
                {!err.resolved && (
                  <button
                    onClick={() => resolve(err.id)}
                    className="flex-shrink-0 text-xs text-emerald-600 hover:text-emerald-700 font-bold"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
