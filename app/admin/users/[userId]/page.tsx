"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Briefcase, Ticket } from "lucide-react";

type Deal = {
  id: string;
  company: string;
  contact_name: string;
  contact_email: string;
  status: string;
  value: string | null;
  notes: string | null;
  created_at: string;
};

type Email = {
  id: string;
  contact_email: string;
  campaign_name: string | null;
  sent_at: string;
};

type TicketRow = {
  id: string;
  brand_name: string;
  brand_url: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type UserDetail = {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
  createdAt: string;
  lastActiveAt: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  pitched:     "bg-sky-100 text-sky-700",
  replied:     "bg-violet-100 text-violet-700",
  negotiating: "bg-amber-100 text-amber-700",
  contracted:  "bg-emerald-100 text-emerald-700",
  delivered:   "bg-teal-100 text-teal-700",
  paid:        "bg-green-100 text-green-700",
};

const AGREED_STATUSES = new Set(["contracted", "delivered", "paid"]);

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${STATUS_STYLES[status] || "bg-navy-100 text-navy-500"}`}>
      {status}
    </span>
  );
}

function fmtValue(v: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(v);
}

function parseDealValue(v: string | null | undefined): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function timeAgo(iso: string | null) {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [agreedValue, setAgreedValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user);
        setDeals(d.deals || []);
        setEmails(d.emails || []);
        setTickets(d.tickets || []);
        setAgreedValue(d.agreedValue || 0);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-navy-300 text-sm" style={{ background: "#F7F8FA" }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center text-navy-400 text-sm" style={{ background: "#F7F8FA" }}>
        User not found.
      </div>
    );
  }

  const totalDealValue = deals.reduce((s, d) => s + parseDealValue(d.value), 0);

  return (
    <div className="h-full flex flex-col overflow-y-auto p-8" style={{ background: "#F7F8FA" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users" className="text-navy-400 hover:text-navy-700"><ArrowLeft size={18} /></Link>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Admin / Users</p>
          <h1 className="text-2xl font-black text-navy-900">{user.name}</h1>
        </div>
      </div>

      {/* User card */}
      <div className="bg-white rounded-2xl border p-6 mb-6 flex items-center gap-5" style={{ borderColor: "var(--border)" }}>
        {user.imageUrl ? (
          <img src={user.imageUrl} alt={user.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-coral-100 flex items-center justify-center text-coral-600 text-xl font-black flex-shrink-0">
            {user.name[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-navy-900">{user.name}</p>
          <p className="text-sm text-navy-400">{user.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-right flex-shrink-0">
          <span className="text-navy-400 text-xs">Joined</span>
          <span className="font-bold text-navy-700">{new Date(user.createdAt).toLocaleDateString("en-GB")}</span>
          <span className="text-navy-400 text-xs">Last active</span>
          <span className="font-bold text-navy-700">{timeAgo(user.lastActiveAt)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Stat label="Emails sent" value={emails.length} />
        <Stat label="Deals" value={deals.length} />
        <Stat label="Pipeline value" value={totalDealValue > 0 ? fmtValue(totalDealValue) : "—"} />
        <Stat label="Agreed value" value={agreedValue > 0 ? fmtValue(agreedValue) : "—"} highlight={agreedValue > 0} />
      </div>

      {/* Pipeline */}
      <Section icon={<Briefcase size={15} />} title="Pipeline" count={deals.length}>
        {deals.length === 0 ? (
          <Empty>No deals in pipeline.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                <Th>Brand</Th>
                <Th>Contact</Th>
                <Th>Status</Th>
                <Th>Value</Th>
                <Th>Notes</Th>
                <Th>Added</Th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id} className="border-b last:border-0 hover:bg-navy-50/30" style={{ borderColor: "var(--border)" }}>
                  <td className="px-5 py-3 font-bold text-navy-900">{d.company || "—"}</td>
                  <td className="px-5 py-3">
                    <p className="text-navy-700">{d.contact_name || "—"}</p>
                    <p className="text-xs text-navy-400">{d.contact_email}</p>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-5 py-3">
                    {d.value ? (
                      <span className={`font-bold ${AGREED_STATUSES.has(d.status) ? "text-emerald-600" : "text-navy-700"}`}>
                        {d.value}
                      </span>
                    ) : (
                      <span className="text-navy-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-navy-500 max-w-[160px] truncate" title={d.notes || ""}>
                    {d.notes || "—"}
                  </td>
                  <td className="px-5 py-3 text-xs text-navy-400">{new Date(d.created_at).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Recent emails */}
      <Section icon={<Mail size={15} />} title="Recent emails" count={emails.length} subtitle="last 50">
        {emails.length === 0 ? (
          <Empty>No emails recorded.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                <Th>To</Th>
                <Th>Campaign</Th>
                <Th>Sent</Th>
              </tr>
            </thead>
            <tbody>
              {emails.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-navy-50/30" style={{ borderColor: "var(--border)" }}>
                  <td className="px-5 py-2.5 text-navy-700">{e.contact_email}</td>
                  <td className="px-5 py-2.5 text-navy-500 text-xs">{e.campaign_name || "—"}</td>
                  <td className="px-5 py-2.5 text-navy-400 text-xs">{new Date(e.sent_at).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Tickets */}
      {tickets.length > 0 && (
        <Section icon={<Ticket size={15} />} title="Support tickets" count={tickets.length}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                <Th>Brand</Th>
                <Th>URL</Th>
                <Th>Status</Th>
                <Th>Submitted</Th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-navy-50/30" style={{ borderColor: "var(--border)" }}>
                  <td className="px-5 py-2.5 font-bold text-navy-900">{t.brand_name}</td>
                  <td className="px-5 py-2.5 text-xs text-navy-400 truncate max-w-[180px]">
                    <a href={t.brand_url} target="_blank" rel="noopener noreferrer" className="hover:underline">{t.brand_url}</a>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-navy-100 text-navy-600">{t.status}</span>
                  </td>
                  <td className="px-5 py-2.5 text-xs text-navy-400">{new Date(t.created_at).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
      <p className="text-xs text-navy-400 mb-1">{label}</p>
      <p className={`text-3xl font-black ${highlight ? "text-emerald-600" : "text-navy-900"}`}>{value}</p>
    </div>
  );
}

function Section({ icon, title, count, subtitle, children }: {
  icon: React.ReactNode;
  title: string;
  count: number;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden mb-5" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="text-navy-400">{icon}</span>
        <span className="font-black text-navy-900 text-sm">{title}</span>
        <span className="text-xs text-navy-400 font-medium">
          {count}{subtitle ? ` · ${subtitle}` : ""}
        </span>
      </div>
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest text-navy-400">{children}</th>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-6 text-sm text-navy-300">{children}</p>;
}
