"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Plus, X, Trash2, CalendarDays,
  Clock, Instagram, Tv2, Facebook, FileImage, Video, Layers,
  BookOpen, CheckCircle2, Circle, Pencil,
} from "lucide-react";
import {
  getScheduledPosts, upsertScheduledPost, deleteScheduledPost,
  getRecipes,
} from "@/lib/storage";
import type { ScheduledPost, Platform, MediaType, PostStatus, Recipe } from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, "0"); }

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// 0=Sun offset for Monday-start grid
function firstDayOffset(year: number, month: number) {
  const day = new Date(year, month, 1).getDay(); // 0=Sun
  return day === 0 ? 6 : day - 1; // Mon=0 … Sun=6
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ── Status / Platform / Media config ────────────────────────

const STATUS_CONFIG: Record<PostStatus, { label: string; colour: string; dot: string }> = {
  idea:      { label: "Idea",      colour: "bg-navy-100 text-navy-600",              dot: "bg-navy-300" },
  scheduled: { label: "Scheduled", colour: "bg-coral-100 text-coral-700",            dot: "bg-coral-400" },
  posted:    { label: "Posted",    colour: "bg-green-100 text-green-700",            dot: "bg-green-400" },
};

const PLATFORM_CONFIG: Record<Platform, { label: string; icon: React.ReactNode; colour: string }> = {
  instagram: { label: "Instagram", icon: <Instagram size={12} />, colour: "bg-pink-50 text-pink-600 border-pink-200" },
  tiktok:    { label: "TikTok",    icon: <Tv2 size={12} />,       colour: "bg-slate-50 text-slate-600 border-slate-200" },
  facebook:  { label: "Facebook",  icon: <Facebook size={12} />,  colour: "bg-blue-50 text-blue-600 border-blue-200" },
};

const MEDIA_CONFIG: Record<MediaType, { label: string; icon: React.ReactNode }> = {
  photo:    { label: "Photo",    icon: <FileImage size={13} /> },
  reel:     { label: "Reel",     icon: <Video size={13} /> },
  carousel: { label: "Carousel", icon: <Layers size={13} /> },
  story:    { label: "Story",    icon: <BookOpen size={13} /> },
};

// ── Post Modal ───────────────────────────────────────────────

const DEFAULT_POST: Omit<ScheduledPost, "id" | "createdAt"> = {
  date: toDateStr(new Date()),
  time: "09:00",
  platforms: ["instagram"],
  mediaType: "photo",
  caption: "",
  status: "idea",
  recipeId: undefined,
  recipeTitle: undefined,
  notes: "",
};

function PostModal({
  initial,
  overrides,
  recipes,
  onSave,
  onDelete,
  onClose,
}: {
  initial?: ScheduledPost;
  overrides?: Partial<Omit<ScheduledPost, "id" | "createdAt">>;
  recipes: Recipe[];
  onSave: (p: ScheduledPost) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<ScheduledPost, "id" | "createdAt">>(
    initial
      ? {
          date: initial.date,
          time: initial.time || "09:00",
          platforms: initial.platforms,
          mediaType: initial.mediaType,
          caption: initial.caption || "",
          status: initial.status,
          recipeId: initial.recipeId,
          recipeTitle: initial.recipeTitle,
          notes: initial.notes || "",
        }
      : { ...DEFAULT_POST, ...(overrides || {}) }
  );

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const togglePlatform = (p: Platform) => {
    set(
      "platforms",
      form.platforms.includes(p)
        ? form.platforms.filter((x) => x !== p)
        : [...form.platforms, p]
    );
  };

  const handleSave = () => {
    if (!form.date) return;
    onSave({
      ...form,
      id: initial?.id || crypto.randomUUID(),
      createdAt: initial?.createdAt || new Date().toISOString(),
    });
  };

  const setRecipe = (id: string) => {
    if (!id) {
      set("recipeId", undefined);
      set("recipeTitle", undefined);
    } else {
      const r = recipes.find((x) => x.id === id);
      set("recipeId", id);
      set("recipeTitle", r?.title);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-cream-100 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-navy-900">
            {initial ? "Edit Post" : "New Post"}
          </h2>
          <button onClick={onClose} className="text-navy-300 hover:text-navy-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Date + Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy-600 mb-1.5 uppercase tracking-wide">
                Date *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-600 mb-1.5 uppercase tracking-wide">
                Time
              </label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
                className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
              />
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-xs font-semibold text-navy-600 mb-2 uppercase tracking-wide">
              Platform
            </label>
            <div className="flex gap-2">
              {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-medium transition-colors ${
                    form.platforms.includes(p)
                      ? PLATFORM_CONFIG[p].colour + " border-current"
                      : "border-cream-200 text-navy-400 hover:border-navy-300"
                  }`}
                >
                  {PLATFORM_CONFIG[p].icon}
                  {PLATFORM_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Media type */}
          <div>
            <label className="block text-xs font-semibold text-navy-600 mb-2 uppercase tracking-wide">
              Content Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(MEDIA_CONFIG) as MediaType[]).map((m) => (
                <button
                  key={m}
                  onClick={() => set("mediaType", m)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-medium transition-colors ${
                    form.mediaType === m
                      ? "bg-navy-800 text-white border-navy-800"
                      : "border-cream-200 text-navy-500 hover:border-navy-300"
                  }`}
                >
                  {MEDIA_CONFIG[m].icon}
                  {MEDIA_CONFIG[m].label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-navy-600 mb-2 uppercase tracking-wide">
              Status
            </label>
            <div className="flex gap-2">
              {(Object.keys(STATUS_CONFIG) as PostStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => set("status", s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-medium transition-colors ${
                    form.status === s
                      ? STATUS_CONFIG[s].colour + " border-current"
                      : "border-cream-200 text-navy-400 hover:border-navy-300"
                  }`}
                >
                  {s === "posted" ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Link to recipe */}
          {recipes.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-navy-600 mb-1.5 uppercase tracking-wide">
                Linked Recipe
              </label>
              <select
                value={form.recipeId || ""}
                onChange={(e) => setRecipe(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
              >
                <option value="">— None —</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-xs font-semibold text-navy-600 mb-1.5 uppercase tracking-wide">
              Caption
            </label>
            <textarea
              value={form.caption}
              onChange={(e) => set("caption", e.target.value)}
              placeholder="Draft your caption here…"
              rows={4}
              className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent resize-none"
            />
            <p className="text-right text-[10px] text-navy-300 mt-1">{form.caption?.length || 0} chars</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-navy-600 mb-1.5 uppercase tracking-wide">
              Notes
            </label>
            <input
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Reminders, hashtags to try, etc."
              className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-cream-100 flex items-center justify-between">
          {initial && onDelete ? (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
            >
              <Trash2 size={13} /> Delete
            </button>
          ) : <div />}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-navy-500 hover:text-navy-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.date || form.platforms.length === 0}
              className="px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {initial ? "Save Changes" : "Add to Calendar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Scheduler inner (uses useSearchParams) ───────────────────

function SchedulerInner() {
  const searchParams = useSearchParams();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null | "new">(null);
  const [newPostDate, setNewPostDate] = useState<string | undefined>(undefined);
  const [newPostDefaults, setNewPostDefaults] = useState<Partial<ScheduledPost>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const allPosts = getScheduledPosts();
    const allRecipes = getRecipes();
    setPosts(allPosts);
    setRecipes(allRecipes);
    setMounted(true);

    // Handle ?recipeId=... from recipe library
    const recipeId = searchParams.get("recipeId");
    const recipeTitle = searchParams.get("recipeTitle");
    if (recipeId) {
      setNewPostDefaults({ recipeId, recipeTitle: recipeTitle || undefined });
      setEditingPost("new");
    }
  }, [searchParams]);

  const handleSave = (post: ScheduledPost) => {
    upsertScheduledPost(post);
    setPosts(getScheduledPosts());
    setEditingPost(null);
    setNewPostDate(undefined);
    setNewPostDefaults({});
  };

  const handleDelete = (id: string) => {
    deleteScheduledPost(id);
    setPosts(getScheduledPosts());
    setEditingPost(null);
  };

  const openNew = (date?: string) => {
    setNewPostDate(date);
    setNewPostDefaults({});
    setEditingPost("new");
  };

  // Calendar helpers
  const totalDays = daysInMonth(year, month);
  const offset = firstDayOffset(year, month);
  const totalCells = Math.ceil((offset + totalDays) / 7) * 7;

  const postsByDate = posts.reduce<Record<string, ScheduledPost[]>>((acc, p) => {
    (acc[p.date] ||= []).push(p);
    return acc;
  }, {});

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  // Summary counts
  const monthPosts = posts.filter((p) => p.date.startsWith(`${year}-${pad(month + 1)}`));
  const ideaCount = monthPosts.filter((p) => p.status === "idea").length;
  const scheduledCount = monthPosts.filter((p) => p.status === "scheduled").length;
  const postedCount = monthPosts.filter((p) => p.status === "posted").length;

  if (!mounted) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-10 bg-coral-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">
            Content
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-bold text-navy-900 leading-tight">
              Content Planner
            </h1>
            <p className="mt-2 text-navy-500 text-base">
              Plan and track what you&apos;re posting — and when.
            </p>
          </div>
          <button
            onClick={() => openNew()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors mt-1"
          >
            <Plus size={15} /> Add Post
          </button>
        </div>
      </div>

      {/* Month summary pills */}
      {monthPosts.length > 0 && (
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs text-navy-400">{MONTH_NAMES[month]}:</span>
          {ideaCount > 0 && (
            <span className="px-2.5 py-1 bg-navy-100 text-navy-600 text-xs font-medium rounded-lg">
              {ideaCount} idea{ideaCount !== 1 ? "s" : ""}
            </span>
          )}
          {scheduledCount > 0 && (
            <span className="px-2.5 py-1 bg-coral-100 text-coral-700 text-xs font-medium rounded-lg">
              {scheduledCount} scheduled
            </span>
          )}
          {postedCount > 0 && (
            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg">
              {postedCount} posted
            </span>
          )}
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Month nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-100">
          <button
            onClick={prevMonth}
            className="p-1.5 text-navy-400 hover:text-navy-800 hover:bg-cream-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-serif text-lg font-bold text-navy-900">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-1.5 text-navy-400 hover:text-navy-800 hover:bg-cream-100 rounded-lg transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-cream-100">
          {DAY_LABELS.map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-navy-300">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 divide-x divide-cream-100">
          {Array.from({ length: totalCells }, (_, i) => {
            const dayNum = i - offset + 1;
            const isCurrentMonth = dayNum >= 1 && dayNum <= totalDays;
            const dateStr = isCurrentMonth
              ? `${year}-${pad(month + 1)}-${pad(dayNum)}`
              : null;
            const isToday = dateStr === toDateStr(today);
            const dayPosts = dateStr ? (postsByDate[dateStr] || []) : [];

            return (
              <div
                key={i}
                className={`min-h-[90px] p-2 border-b border-cream-100 ${
                  isCurrentMonth ? "bg-white hover:bg-cream-50 cursor-pointer" : "bg-cream-50/50"
                } transition-colors relative`}
                onClick={() => isCurrentMonth && dateStr && openNew(dateStr)}
              >
                {isCurrentMonth && (
                  <>
                    <span
                      className={`text-xs font-semibold leading-none block w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                        isToday
                          ? "bg-coral-500 text-white"
                          : "text-navy-600"
                      }`}
                    >
                      {dayNum}
                    </span>
                    <div className="space-y-0.5">
                      {dayPosts.slice(0, 3).map((post) => (
                        <div
                          key={post.id}
                          onClick={(e) => { e.stopPropagation(); setEditingPost(post); }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer ${STATUS_CONFIG[post.status].colour} hover:opacity-80`}
                        >
                          {post.time && (
                            <span className="opacity-60 mr-1">{post.time}</span>
                          )}
                          {post.recipeTitle || mediaTypeLabel(post.mediaType)}
                        </div>
                      ))}
                      {dayPosts.length > 3 && (
                        <div className="text-[9px] text-navy-400 pl-1">
                          +{dayPosts.length - 3} more
                        </div>
                      )}
                    </div>
                    {/* Add button on hover */}
                    <button
                      onClick={(e) => { e.stopPropagation(); dateStr && openNew(dateStr); }}
                      className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center bg-coral-100 text-coral-600 rounded-md text-xs hover:bg-coral-200 transition-all"
                    >
                      <Plus size={10} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming list */}
      {(() => {
        const todayStr = toDateStr(today);
        const upcoming = posts
          .filter((p) => p.date >= todayStr && p.status !== "posted")
          .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
          .slice(0, 8);

        if (upcoming.length === 0) return null;

        return (
          <div className="mt-6 bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-cream-100">
              <h3 className="text-sm font-semibold text-navy-800">Coming Up</h3>
            </div>
            <div className="divide-y divide-cream-100">
              {upcoming.map((post) => (
                <div
                  key={post.id}
                  className="px-6 py-3.5 flex items-center gap-4 hover:bg-cream-50 cursor-pointer transition-colors"
                  onClick={() => setEditingPost(post)}
                >
                  <div className="text-center w-10 flex-shrink-0">
                    <p className="text-[10px] font-bold uppercase text-navy-300">
                      {MONTH_NAMES[parseInt(post.date.split("-")[1]) - 1].slice(0, 3)}
                    </p>
                    <p className="font-serif text-xl font-bold text-navy-800 leading-none">
                      {parseInt(post.date.split("-")[2])}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_CONFIG[post.status].colour}`}>
                        {STATUS_CONFIG[post.status].label}
                      </span>
                      {post.platforms.map((p) => (
                        <span key={p} className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded text-[10px] font-medium ${PLATFORM_CONFIG[p].colour}`}>
                          {PLATFORM_CONFIG[p].icon}
                          {PLATFORM_CONFIG[p].label}
                        </span>
                      ))}
                      <span className="text-[10px] text-navy-400">
                        {MEDIA_CONFIG[post.mediaType].label}
                      </span>
                    </div>
                    <p className="text-sm text-navy-700 truncate">
                      {post.recipeTitle
                        ? <span className="font-medium">{post.recipeTitle}</span>
                        : post.caption
                        ? post.caption
                        : <span className="text-navy-300 italic">No caption yet</span>}
                    </p>
                  </div>
                  {post.time && (
                    <div className="flex items-center gap-1 text-xs text-navy-400 flex-shrink-0">
                      <Clock size={11} />
                      {post.time}
                    </div>
                  )}
                  <Pencil size={13} className="text-navy-300 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-navy-400">
        {(Object.keys(STATUS_CONFIG) as PostStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
            {STATUS_CONFIG[s].label}
          </div>
        ))}
        <span className="ml-2 text-navy-300">· Click any day to add a post</span>
      </div>

      {/* Modal */}
      {editingPost !== null && (
        <PostModal
          initial={editingPost === "new" ? undefined : editingPost}
          overrides={editingPost === "new" ? {
            date: newPostDate || toDateStr(today),
            ...newPostDefaults,
          } : undefined}
          recipes={recipes}
          onSave={handleSave}
          onDelete={editingPost !== "new" ? () => handleDelete(editingPost.id) : undefined}
          onClose={() => { setEditingPost(null); setNewPostDate(undefined); setNewPostDefaults({}); }}
        />
      )}
    </div>
  );
}

function mediaTypeLabel(t: MediaType) {
  return MEDIA_CONFIG[t]?.label || t;
}

// ── Page (wraps in Suspense for useSearchParams) ─────────────

export default function SchedulerPage() {
  return (
    <Suspense fallback={null}>
      <SchedulerInner />
    </Suspense>
  );
}
