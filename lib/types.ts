export type Contact = {
    name: string;
    email: string;
    position: string;
    company: string;
};

export type Campaign = {
    id: string;
    name: string;
    subject: string;
    body: string;
    contacts: Contact[];
    createdAt: string;
};

export type BrandCategory =
    | "Snacks & Crisps"
  | "Confectionery"
  | "Drinks"
  | "Coffee & Tea"
  | "Beer & Brewing"
  | "Wine & Spirits"
  | "Bakery & Bread"
  | "Dairy & Alternatives"
  | "Casual Dining & Restaurants"
  | "Grocery & Food Brands"
  | "Health & Wellness Food"
  | "Baby & Kids Food"
  | "Other";

export type StoredContact = {
    id: string;
    name: string;
    email: string;
    position: string;
    company: string;
    linkedin: string;
    notes: string;
    category?: BrandCategory;
    createdAt: string;
};

export type EmailRecord = {
    id: string;
    contactEmail: string;
    subject: string;
    body: string;
    sentAt: string;
    campaignId?: string;
    campaignName?: string;
};

// ── Content Planner ─────────────────────────────────────────

export type Platform = "instagram" | "tiktok" | "facebook";
export type MediaType = "photo" | "reel" | "carousel" | "story";
export type PostStatus = "idea" | "scheduled" | "posted";

export type ScheduledPost = {
    id: string;
    date: string; // YYYY-MM-DD
    time?: string; // HH:MM
    platforms: Platform[];
    mediaType: MediaType;
    caption?: string;
    status: PostStatus;
    notes?: string;
    createdAt: string;
};

