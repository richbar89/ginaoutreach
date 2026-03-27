import { notFound } from "next/navigation";
import type { MediaKit } from "@/lib/types";

async function getKit(token: string): Promise<MediaKit | null> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const res = await fetch(`${base}/api/media-kit?token=${token}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PublicKitPage({ params }: { params: { token: string } }) {
  const kit = await getKit(params.token);
  if (!kit) notFound();

  const hasIg = kit.igFollowers || kit.igEngagementRate;
  const hasTt = kit.ttFollowers || kit.ttAvgViews;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#fdf8f4]">
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0d1829 0%, #1a2e4a 100%)" }}>
        <div className="max-w-2xl mx-auto px-8 py-16 flex items-center gap-8">
          {kit.profileImageUrl && (
            <img
              src={kit.profileImageUrl}
              alt={kit.name}
              className="w-24 h-24 rounded-2xl object-cover flex-shrink-0 border-2 border-white/20"
            />
          )}
          <div>
            {kit.handle && (
              <p className="text-[11px] font-bold uppercase tracking-widest text-coral-400 mb-2">{kit.handle}</p>
            )}
            <h1 className="font-serif text-4xl font-bold text-white leading-tight mb-2">
              {kit.name || "Media Kit"}
            </h1>
            {kit.tagline && (
              <p className="text-navy-300 text-base">{kit.tagline}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-12 space-y-10">

        {/* Bio */}
        {kit.bio && (
          <section>
            <p className="text-navy-700 text-base leading-relaxed">{kit.bio}</p>
          </section>
        )}

        {/* Stats */}
        {(hasIg || hasTt) && (
          <section>
            <SectionTitle>By the numbers</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {kit.igFollowers && (
                <StatCard value={kit.igFollowers.toLocaleString()} label="Instagram Followers" />
              )}
              {kit.igEngagementRate && (
                <StatCard value={`${kit.igEngagementRate}%`} label="Engagement Rate" highlight />
              )}
              {kit.igAvgLikes && (
                <StatCard value={kit.igAvgLikes.toLocaleString()} label="Avg. Likes" />
              )}
              {kit.ttFollowers && (
                <StatCard value={kit.ttFollowers} label="TikTok Followers" />
              )}
              {kit.ttAvgViews && (
                <StatCard value={kit.ttAvgViews} label="Avg. TikTok Views" />
              )}
            </div>
          </section>
        )}

        {/* Audience */}
        {(kit.audienceAge || kit.audienceGender || kit.audienceTopLocation) && (
          <section>
            <SectionTitle>Audience</SectionTitle>
            <div className="grid grid-cols-3 gap-4">
              {kit.audienceAge && <AudienceCard label="Primary Age" value={kit.audienceAge} />}
              {kit.audienceGender && <AudienceCard label="Gender" value={kit.audienceGender} />}
              {kit.audienceTopLocation && <AudienceCard label="Top Location" value={kit.audienceTopLocation} />}
            </div>
          </section>
        )}

        {/* Rates */}
        {kit.rates?.filter(r => r.label && r.price).length > 0 && (
          <section>
            <SectionTitle>Rates</SectionTitle>
            <div className="bg-white border border-[#e8e0d8] rounded-2xl overflow-hidden divide-y divide-[#f0e8e0]">
              {kit.rates.filter(r => r.label && r.price).map((r, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4">
                  <p className="text-navy-800 text-sm font-medium">{r.label}</p>
                  <p className="font-serif text-xl font-bold text-navy-900">{r.price}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-navy-400 mt-3">
              All rates are indicative. Packages and bundles available on request.
            </p>
          </section>
        )}

        {/* Past brands */}
        {kit.pastBrands?.filter(b => b.name).length > 0 && (
          <section>
            <SectionTitle>Previous Brand Partnerships</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {kit.pastBrands.filter(b => b.name).map((b, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-white border border-[#e8e0d8] rounded-xl text-sm font-semibold text-navy-700"
                >
                  {b.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        {kit.email && (
          <section className="text-center py-8">
            <div
              className="inline-block px-10 py-8 rounded-2xl text-center"
              style={{ background: "linear-gradient(135deg, #e8715a 0%, #d4604a 100%)" }}
            >
              <p className="text-white/80 text-sm mb-2">Ready to work together?</p>
              <a
                href={`mailto:${kit.email}`}
                className="font-serif text-2xl font-bold text-white hover:underline"
              >
                {kit.email}
              </a>
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="text-center pb-6">
          <p className="text-[11px] text-navy-400">
            Created with GinaOS
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-px w-8 bg-[#e8715a]" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-[#e8715a]">{children}</p>
    </div>
  );
}

function StatCard({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className="bg-white border border-[#e8e0d8] rounded-2xl p-5 text-center">
      <p className={`font-serif text-3xl font-bold leading-none mb-1.5 ${highlight ? "text-[#e8715a]" : "text-[#0d1829]"}`}>
        {value}
      </p>
      <p className="text-[11px] font-medium text-[#8a7e74] leading-snug">{label}</p>
    </div>
  );
}

function AudienceCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#e8e0d8] rounded-2xl p-5 text-center">
      <p className="font-serif text-xl font-bold text-[#0d1829] mb-1">{value}</p>
      <p className="text-[11px] font-medium text-[#8a7e74]">{label}</p>
    </div>
  );
}
