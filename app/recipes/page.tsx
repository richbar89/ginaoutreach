"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BookImage, Plus, Search, ExternalLink, Pencil, Trash2,
  CalendarDays, Tag, X, Loader2, Download, ImagePlus,
} from "lucide-react";
import { getRecipes, upsertRecipe, deleteRecipe } from "@/lib/storage";
import type { Recipe } from "@/lib/types";

const CATEGORIES = [
  "Breakfast", "Lunch", "Dinner", "Side Dishes",
  "Snacks & Desserts", "Sweet Treats", "Christmas",
  "Drinks", "Cocktails", "Other",
];

const EMPTY: Omit<Recipe, "id" | "createdAt" | "images" | "imageUrl"> = {
  title: "",
  url: "",
  description: "",
  category: "Other",
  tags: [],
};

function RecipeModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Recipe;
  onSave: (r: Recipe) => void;
  onClose: () => void;
}) {
  // Stable ID for the lifetime of this modal (so uploads work before first save)
  const [recipeId] = useState(() => initial?.id || crypto.randomUUID());
  const [form, setForm] = useState<Omit<Recipe, "id" | "createdAt" | "images" | "imageUrl">>(
    initial ? {
      title: initial.title,
      url: initial.url,
      description: initial.description || "",
      category: initial.category,
      tags: initial.tags,
    } : { ...EMPTY }
  );
  const [images, setImages] = useState<string[]>(initial?.images || []);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form, v: string | string[]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      set("tags", [...form.tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (t: string) =>
    set("tags", form.tags.filter((x) => x !== t));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("recipeId", recipeId);
        const res = await fetch("/api/upload-recipe-image", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          uploaded.push(data.path);
        }
      }
      setImages((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async (path: string, index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    const filename = path.split("/").pop() || "";
    await fetch(
      `/api/upload-recipe-image?recipeId=${recipeId}&filename=${encodeURIComponent(filename)}`,
      { method: "DELETE" }
    );
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({
      ...form,
      images,
      id: recipeId,
      createdAt: initial?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-cream-100 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-navy-900">
            {initial ? "Edit Recipe" : "Add Recipe"}
          </h2>
          <button onClick={onClose} className="text-navy-300 hover:text-navy-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-navy-600 mb-1.5 uppercase tracking-wide">
              Recipe Title *
            </label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Creamy Oat Porridge with Berries"
              className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-semibold text-navy-600 mb-1.5 uppercase tracking-wide">
              Recipe URL
            </label>
            <input
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://yourwebsite.com/recipes/..."
              type="url"
              className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-xs font-semibold text-navy-600 mb-1.5 uppercase tracking-wide">
              Photos
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {images.map((src, i) => (
                  <div
                    key={src}
                    className="relative group w-20 h-20 rounded-xl overflow-hidden border border-cream-200 flex-shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveImage(src, i)}
                      className="absolute inset-0 flex items-center justify-center bg-navy-900/60 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} className="text-white" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-white/90 text-navy-700 px-1 rounded">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-dashed border-cream-300 hover:border-coral-300 hover:bg-coral-50 text-navy-500 hover:text-coral-600 text-sm rounded-xl transition-colors disabled:opacity-60"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
              {uploading ? "Uploading…" : "Add Photos"}
            </button>
            <p className="mt-1.5 text-[11px] text-navy-400">
              Stored on GinaOS — right-click any thumbnail to save for Stories. First photo is the cover.
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-navy-600 mb-1.5 uppercase tracking-wide">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-navy-600 mb-1.5 uppercase tracking-wide">
              Tags
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {form.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-coral-50 text-coral-700 text-xs font-medium rounded-lg"
                >
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-coral-900">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="oats, healthy, quick... (press Enter)"
                className="flex-1 px-3.5 py-2.5 border border-cream-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
              />
              <button
                onClick={addTag}
                className="px-3 py-2 bg-cream-100 hover:bg-cream-200 rounded-xl text-xs text-navy-600 font-medium transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-navy-600 mb-1.5 uppercase tracking-wide">
              Notes (optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Quick caption ideas, best time to post, etc."
              rows={2}
              className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-cream-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-navy-500 hover:text-navy-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title.trim()}
            className="px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {initial ? "Save Changes" : "Add Recipe"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecipeImage({ imageUrl, images, title }: { imageUrl?: string; images?: string[]; title: string }) {
  // Prefer first uploaded image, fall back to legacy imageUrl
  const src = images?.[0] || imageUrl;
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <BookImage size={28} className="text-cream-300" />
      </div>
    );
  }

  // All uploaded images are local paths (not http)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      onError={() => setFailed(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    />
  );
}

function GalleryModal({
  recipe,
  onClose,
  onAddImages,
  onRemoveImage,
}: {
  recipe: Recipe;
  onClose: () => void;
  onAddImages: (files: FileList) => Promise<void>;
  onRemoveImage: (index: number) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const images = recipe.images || [];

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    setUploadError("");
    try {
      await onAddImages(e.target.files);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-navy-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-cream-100 flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2.5 bg-navy-100 hover:bg-navy-200 active:bg-navy-300 text-navy-700 text-sm font-semibold rounded-xl flex-shrink-0 transition-colors"
        >
          <X size={16} /> Close
        </button>
        <h3 className="font-serif font-bold text-navy-900 text-base truncate flex-1">
          {recipe.title}
        </h3>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-coral-500 hover:bg-coral-600 active:bg-coral-700 text-white text-xs font-semibold rounded-xl flex-shrink-0 disabled:opacity-60"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
          {uploading ? "Uploading…" : "Add Photos"}
        </button>
      </div>

      {uploadError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs font-medium flex-shrink-0">
          {uploadError}
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/40">
            <BookImage size={40} />
            <p className="text-sm">No photos yet — tap Add Photos above</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((src, i) => (
              <div key={src} className="relative aspect-square rounded-xl overflow-hidden bg-navy-800 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-2 left-2 text-[9px] font-bold bg-white/90 text-navy-700 px-1.5 py-0.5 rounded">
                    Cover
                  </span>
                )}
                {/* Remove */}
                <button
                  onClick={() => onRemoveImage(i)}
                  className="absolute top-2 right-2 p-1 rounded-lg bg-navy-900/70 text-white opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                >
                  <X size={13} />
                </button>
                {/* Download */}
                <a
                  href={`${src}?dl=1`}
                  download
                  className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/90 text-navy-600 hover:text-coral-500 text-[11px] font-semibold transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={12} /> Save
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecipeCard({
  recipe,
  onEdit,
  onDelete,
  onSchedule,
  onUploadImage,
  onOpenGallery,
}: {
  recipe: Recipe;
  onEdit: () => void;
  onDelete: () => void;
  onSchedule: () => void;
  onUploadImage: (files: FileList) => Promise<void>;
  onOpenGallery: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const cardFileRef = useRef<HTMLInputElement>(null);
  const images = recipe.images || [];
  const hasImage = images.length > 0;

  const handleCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try { await onUploadImage(e.target.files); }
    finally { setUploading(false); if (cardFileRef.current) cardFileRef.current.value = ""; }
  };

  return (
    <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm group hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="aspect-[4/3] bg-cream-100 overflow-hidden relative">
        <RecipeImage imageUrl={recipe.imageUrl} images={recipe.images} title={recipe.title} />
        {/* Category chip */}
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-navy-700 text-[10px] font-semibold rounded-lg">
          {recipe.category}
        </span>
        <input ref={cardFileRef} type="file" accept="image/*" multiple onChange={handleCardUpload} className="hidden" />
        {!hasImage ? (
          // No image — big upload prompt
          <button
            onClick={() => cardFileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-cream-50/80 hover:bg-coral-50/80 transition-colors"
          >
            {uploading ? <Loader2 size={20} className="text-coral-400 animate-spin" /> : <ImagePlus size={20} className="text-coral-400" />}
            <span className="text-[11px] font-semibold text-coral-500">{uploading ? "Uploading…" : "Add Photo"}</span>
          </button>
        ) : (
          // Has images — tap thumbnail to open gallery
          <>
            <button onClick={onOpenGallery} className="absolute inset-0" aria-label="View photos" />
            {images.length > 1 && (
              <span className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-navy-900/70 text-white text-[10px] font-semibold rounded-lg pointer-events-none">
                <BookImage size={10} /> {images.length} photos
              </span>
            )}
            <a
              href={`${images[0]}?dl=1`}
              download
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/90 text-navy-600 hover:text-coral-500 text-[10px] font-semibold transition-colors"
            >
              <Download size={11} /> Save
            </a>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-serif font-bold text-navy-900 text-sm leading-snug mb-1 line-clamp-2">
          {recipe.title}
        </h3>

        {recipe.description && (
          <p className="text-xs text-navy-400 mb-2 line-clamp-2">{recipe.description}</p>
        )}

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {recipe.tags.slice(0, 4).map((t) => (
              <span key={t} className="px-1.5 py-0.5 bg-cream-100 text-navy-500 text-[10px] rounded-md">
                #{t}
              </span>
            ))}
            {recipe.tags.length > 4 && (
              <span className="text-[10px] text-navy-300">+{recipe.tags.length - 4}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-cream-100">
          <button
            onClick={onSchedule}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-coral-500 hover:bg-coral-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <CalendarDays size={11} /> Schedule
          </button>
          {recipe.url && (
            <a
              href={recipe.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 border border-cream-200 hover:border-navy-300 text-navy-400 hover:text-navy-700 rounded-lg transition-colors"
            >
              <ExternalLink size={13} />
            </a>
          )}
          <button
            onClick={onEdit}
            className="p-2 border border-cream-200 hover:border-navy-300 text-navy-400 hover:text-navy-700 rounded-lg transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 border border-cream-200 hover:border-red-200 text-navy-400 hover:text-red-500 rounded-lg transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null | "new">(null);
  const [galleryRecipeId, setGalleryRecipeId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  useEffect(() => {
    const init = async () => {
      // One-time migration: push any localStorage recipes into the DB
      try {
        const local = localStorage.getItem("ginaos_recipes");
        if (local) {
          const localRecipes = JSON.parse(local) as Recipe[];
          if (localRecipes.length > 0) {
            const db = await getRecipes();
            const dbIds = new Set(db.map((r) => r.id));
            const toMigrate = localRecipes.filter((r) => !dbIds.has(r.id));
            if (toMigrate.length > 0) {
              const BATCH = 20;
              for (let i = 0; i < toMigrate.length; i += BATCH) {
                await Promise.all(toMigrate.slice(i, i + BATCH).map(upsertRecipe));
              }
            }
            localStorage.removeItem("ginaos_recipes");
          }
        }
      } catch (e) {
        console.error("Migration error:", e);
      }
      setRecipes(await getRecipes());
      setMounted(true);
    };
    init();
  }, []);

  const handleImport = async () => {
    setImporting(true);
    setImportMsg("");
    try {
      const res = await fetch("/api/import-recipes");
      const data = await res.json();
      if (data.error) { setImportMsg(`Error: ${data.error}`); return; }

      const imported = data.recipes as Recipe[];
      const existing = await getRecipes();

      // Delete existing recipes whose URLs are being replaced by the import
      const importedUrls = new Set(imported.map((r) => r.url));
      const toDelete = existing.filter((r) => importedUrls.has(r.url));
      await Promise.all(toDelete.map((r) => deleteRecipe(r.id)));

      // Upsert all imported recipes in batches — stop on first error so we can show it
      const BATCH = 20;
      for (let i = 0; i < imported.length; i += BATCH) {
        await Promise.all(imported.slice(i, i + BATCH).map(upsertRecipe));
      }
      // Quick sanity check — if DB still empty, something silently failed

      setRecipes(await getRecipes());
      const newCount = imported.length - toDelete.length;
      setImportMsg(
        `Done — ${imported.length} recipes imported. ${newCount > 0 ? `${newCount} new.` : "All up to date."}`
      );
    } catch (err) {
      setImportMsg(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async (recipe: Recipe) => {
    await upsertRecipe(recipe);
    setRecipes(await getRecipes());
    setEditingRecipe(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this recipe?")) return;
    await deleteRecipe(id);
    setRecipes(await getRecipes());
  };

  const handleSchedule = (recipe: Recipe) => {
    router.push(`/scheduler?recipeId=${recipe.id}&recipeTitle=${encodeURIComponent(recipe.title)}`);
  };

  const handleCardUpload = async (recipe: Recipe, files: FileList) => {
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("recipeId", recipe.id);
      const res = await fetch("/api/upload-recipe-image", { method: "POST", body: fd });
      if (res.ok) {
        const { path } = await res.json();
        uploaded.push(path);
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Upload failed (${res.status})`);
      }
    }
    if (uploaded.length) {
      await upsertRecipe({ ...recipe, images: [...(recipe.images || []), ...uploaded] });
      setRecipes(await getRecipes());
    }
  };

  const handleRemoveImage = async (recipe: Recipe, index: number) => {
    const images = recipe.images || [];
    const path = images[index];
    await upsertRecipe({ ...recipe, images: images.filter((_, i) => i !== index) });
    setRecipes(await getRecipes());
    if (path) {
      const filename = path.split("/").pop() || "";
      await fetch(
        `/api/upload-recipe-image?recipeId=${recipe.id}&filename=${encodeURIComponent(filename)}`,
        { method: "DELETE" }
      );
    }
  };

  const categories = ["All", ...Array.from(new Set(recipes.map((r) => r.category)))];

  const filtered = recipes.filter((r) => {
    const matchSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.includes(search.toLowerCase()));
    const matchCat = filterCategory === "All" || r.category === filterCategory;
    return matchSearch && matchCat;
  });

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
              Recipe Library
            </h1>
            <p className="mt-2 text-navy-500 text-base">
              {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"} saved
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handleImport}
              disabled={importing}
              title="Fetches all recipes from ginabnutrition.com and downloads images to GinaOS (takes ~60 seconds)"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-cream-300 hover:border-navy-300 text-navy-600 hover:text-navy-900 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {importing ? "Importing…" : "Import from Website"}
            </button>
            <button
              onClick={() => setEditingRecipe("new")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus size={15} /> Add Recipe
            </button>
          </div>
        </div>
      </div>

      {/* Import feedback */}
      {importing && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin flex-shrink-0" />
          Downloading all recipe images to GinaOS — takes about 60 seconds. Don&apos;t close the tab.
        </div>
      )}
      {!importing && importMsg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${importMsg.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
          {importMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes or tags…"
            className="w-full pl-9 pr-3.5 py-2.5 border border-cream-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag size={13} className="text-navy-300" />
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterCategory === c
                  ? "bg-coral-500 text-white"
                  : "bg-white border border-cream-200 text-navy-500 hover:border-navy-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {recipes.length === 0 && (
        <div className="bg-white border border-cream-200 rounded-2xl p-16 text-center shadow-sm">
          <BookImage size={40} className="text-cream-300 mx-auto mb-4" />
          <h2 className="font-serif text-xl font-bold text-navy-800 mb-2">No recipes yet</h2>
          <p className="text-sm text-navy-400 max-w-sm mx-auto mb-8">
            Add your recipes here with the image, URL and tags — then schedule them straight to your content planner.
          </p>
          <button
            onClick={() => setEditingRecipe("new")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus size={14} /> Add your first recipe
          </button>
        </div>
      )}

      {/* No results */}
      {recipes.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 text-navy-400">
          <p className="text-sm">No recipes match &quot;{search}&quot;</p>
          <button
            onClick={() => { setSearch(""); setFilterCategory("All"); }}
            className="mt-2 text-xs text-coral-500 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={() => setEditingRecipe(recipe)}
              onDelete={() => handleDelete(recipe.id)}
              onSchedule={() => handleSchedule(recipe)}
              onUploadImage={(files) => handleCardUpload(recipe, files)}
              onOpenGallery={() => setGalleryRecipeId(recipe.id)}
            />
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingRecipe !== null && (
        <RecipeModal
          initial={editingRecipe === "new" ? undefined : editingRecipe}
          onSave={handleSave}
          onClose={() => setEditingRecipe(null)}
        />
      )}

      {/* Gallery modal — reads fresh recipe from state on every render */}
      {galleryRecipeId && (() => {
        const gr = recipes.find(r => r.id === galleryRecipeId);
        if (!gr) return null;
        return (
          <GalleryModal
            recipe={gr}
            onClose={() => setGalleryRecipeId(null)}
            onAddImages={(files) => handleCardUpload(gr, files)}
            onRemoveImage={(index) => handleRemoveImage(gr, index)}
          />
        );
      })()}
    </div>
  );
}
