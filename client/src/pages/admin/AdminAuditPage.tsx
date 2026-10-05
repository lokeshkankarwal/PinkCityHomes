import { useState, useEffect } from "react";
import { api } from "../../api/client";

type AuditItem = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  actor?: { name: string; email: string } | null;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");

  useEffect(() => {
    api
      .get<{ results: AuditItem[] }>("/admin/audit-logs")
      .then((d) => setLogs(d.results || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const displayedLogs = logs.filter((log) => {
    if (filterType === "ALL") return true;
    if (filterType === "USER") return log.entityType === "User" || log.action.includes("USER");
    if (filterType === "SELLER") return log.entityType === "SellerProfile" || log.action.includes("SELLER");
    if (filterType === "PROPERTY") return log.entityType === "Property" || log.action.includes("PROPERTY");
    return true;
  });

  const getActionBadge = (action: string) => {
    if (action.includes("DISABLED") || action.includes("DELETED") || action.includes("REJECT")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (action.includes("ENABLED") || action.includes("APPROVE") || action.includes("SOLD")) {
      return "bg-moss/10 text-moss border-moss/30";
    }
    return "bg-ink/5 text-ink border-ink/10";
  };

  return (
    <div className="space-y-6 pb-16 animate-in-page">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="stagger-0">
          <h1 className="font-display text-[28px] font-bold text-ink tracking-[-0.02em] leading-[1.15] mt-1">System Audit Logs</h1>
          <p className="page-subtitle mt-2">
            Immutable event stream capturing administrative actions, seller onboarding, property deletions, and state transitions
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex rounded-xl bg-ink/5 p-1 text-xs font-semibold">
          {[
            { id: "ALL", label: "All Logs" },
            { id: "SELLER", label: "Sellers" },
            { id: "PROPERTY", label: "Properties" },
            { id: "USER", label: "Users" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`rounded-lg px-3.5 py-1.5 transition ${
                filterType === tab.id
                  ? "bg-white text-ink shadow-sm font-bold"
                  : "text-ink/60 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-ink/60">Loading audit trail...</div>
      ) : displayedLogs.length === 0 ? (
        <div className="stagger-1 rounded-[1.25rem] border border-slate-200/70 bg-white p-12 shadow-card text-center text-sm text-ink/60">
          No audit log events found for the selected category.
        </div>
      ) : (
        <div className="stagger-1 rounded-[1.25rem] border border-slate-200/70 bg-white p-6 shadow-card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-[12px] text-slate-500 leading-snug font-semibold text-ink/60 uppercase">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 text-[12px] text-slate-500 leading-snug">
              {displayedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-sand/20">
                  <td className="py-3 px-4 text-ink/60 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-mono label-ui font-bold px-2 py-0.5 rounded-lg border ${getActionBadge(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-ink/80">
                    {log.actor ? (
                      <div>
                        <p className="font-semibold">{log.actor.name}</p>
                        <p className="label-ui text-ink/50 font-mono">{log.actor.email}</p>
                      </div>
                    ) : (
                      <span className="text-ink/50 italic">System / Superadmin</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-ink">{log.entityType}</span>
                    {log.entityId && (
                      <p className="font-mono text-ink/40 label-ui truncate max-w-[140px]">
                        {log.entityId}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono label-ui text-ink/70 max-w-sm truncate">
                    {log.metadata ? (
                      <span title={JSON.stringify(log.metadata, null, 2)}>
                        {JSON.stringify(log.metadata)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
