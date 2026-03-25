"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookImage, Plus, Search, ExternalLink, Pencil, Trash2,
  CalendarDays, Tag, X, Loader2, Download,
} from "lucide-react";
import { getRecipes, upsertRecipe, deleteRecipe, saveRecipes } from "@/lib/storage";
import type { Recipe } from "@/lib/types";

const CATEGORIES = [
  "Breakfast", "Lunch", "Dinner", "Side Dishes",
  "Snacks & Desserts", "Sweet Treats", "Christmas",
  "Drinks", "Cocktails", "Other",
];

const EMPTY: Omit<Recipe, "id" | "createdAt"> = {
  title: "",
  url: "",
  imageUrl: "",
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
  const [form, setForm] = useState<Omit<Recipe, "id" | "createdAt">>(
    initial ? {
      title: initial.title,
      url: initial.url,
      imageUrl: initial.imageUrl || "",
      description: initial.description || "",
      category: initial.category,
      tags: initial.tags,
    } : { ...EMPTY }
  );
  const [tagInput, setTagInput] = useState("");
  const [previewing, setPreviewing] = useState(false);

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

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({
      ...form,
      id: initial?.id || crypto.randomUUID(),
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

          {/* Image URL */}
          <div>
            <label className="block text-xs font-semibold text-navy-600 mb-1.5 uppercase tracking-wide">
              Image URL
            </label>
            <div className="flex gap-2">
              <input
                value={form.imageUrl}
                onChange={(e) => { set("imageUrl", e.target.value); setPreviewing(false); }}
                placeholder="https://... (right-click image on website → Copy Image Address)"
                type="url"
                className="flex-1 px-3.5 py-2.5 border border-cream-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent"
              />
              {form.imageUrl && (
                <button
                  onClick={() => setPreviewing((p) => !p)}
                  className="px-3 py-2 border border-cream-200 rounded-xl text-xs text-navy-500 hover:border-navy-300 transition-colors"
                >
                  {previewing ? "Hide" : "Preview"}
                </button>
              )}
            </div>
            {previewing && form.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.imageUrl}
                alt=""
                className="mt-2 h-32 w-full object-cover rounded-xl border border-cream-200"
                onError={() => setPreviewing(false)}
              />
            )}
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

function RecipeCard({
  recipe,
  onEdit,
  onDelete,
  onSchedule,
}: {
  recipe: Recipe;
  onEdit: () => void;
  onDelete: () => void;
  onSchedule: () => void;
}) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm group hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="aspect-[4/3] bg-cream-100 overflow-hidden relative">
        {recipe.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookImage size={28} className="text-cream-300" />
          </div>
        )}
        {/* Category chip */}
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-navy-700 text-[10px] font-semibold rounded-lg">
          {recipe.category}
        </span>
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
  const [mounted, setMounted] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  useEffect(() => {
    setRecipes(getRecipes());
    setMounted(true);
  }, []);

  const handleImport = async () => {
    setImporting(true);
    setImportMsg("");
    try {
      const res = await fetch("/api/import-recipes");
      const data = await res.json();
      if (data.error) {
        setImportMsg(`Error: ${data.error}`);
        return;
      }
      // Merge: overwrite existing recipes by URL (so re-import always refreshes images)
      const existing = getRecipes();
      const imported = data.recipes as Recipe[];
      const importedByUrl = new Map(imported.map((r) => [r.url, r]));
      // Keep manual entries that aren't from the site, update everything from the import
      const kept = existing.filter((r) => !importedByUrl.has(r.url));
      saveRecipes([...kept, ...imported]);
      setRecipes(getRecipes());
      const added = imported.length - (existing.length - kept.length);
      setImportMsg(
        `Done — ${imported.length} recipes imported. ${added > 0 ? `${added} new.` : "All up to date."}`
      );
    } catch {
      setImportMsg("Import failed. Check your connection.");
    } finally {
      setImporting(false);
    }
  };

  const handleSave = (recipe: Recipe) => {
    upsertRecipe(recipe);
    setRecipes(getRecipes());
    setEditingRecipe(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this recipe?")) return;
    deleteRecipe(id);
    setRecipes(getRecipes());
  };

  const handleSchedule = (recipe: Recipe) => {
    router.push(`/scheduler?recipeId=${recipe.id}&recipeTitle=${encodeURIComponent(recipe.title)}`);
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
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {editingRecipe !== null && (
        <RecipeModal
          initial={editingRecipe === "new" ? undefined : editingRecipe}
          onSave={handleSave}
          onClose={() => setEditingRecipe(null)}
        />
      )}
    </div>
  );
}
