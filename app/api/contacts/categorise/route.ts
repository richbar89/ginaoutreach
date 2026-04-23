import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import type { BrandCategory } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORIES: BrandCategory[] = [
    "Snacks & Crisps",
    "Confectionery",
    "Drinks",
    "Coffee & Tea",
    "Beer & Brewing",
    "Wine & Spirits",
    "Bakery & Bread",
    "Dairy & Alternatives",
    "Casual Dining & Restaurants",
    "Grocery & Food Brands",
    "Health & Wellness Food",
    "Baby & Kids Food",
    "Other",
  ];

export async function POST(req: NextRequest) {
    try {
          const { userId } = await auth();
          if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

          const { company, position } = await req.json();

          if (!company) {
                  return NextResponse.json({ error: "company is required" }, { status: 400 });
          }

          const prompt = `You are a food and drink industry expert. Classify the following brand into exactly one category.
          
          Company: "${company}"
          Contact role: "${position || ""}"
          
          Categories to choose from:
          ${CATEGORIES.map((c) => `- ${c}`).join("\n")}
          
          Rules:
          - Choose the single most fitting category based primarily on what the company sells
          - If the company sells multiple things, pick their primary product category
          - Beer, ale, lager, stout brands go in "Beer & Brewing"
          - Wine, spirits, cocktail brands go in "Wine & Spirits"
          - Juice, soft drinks, energy drinks, functional drinks go in "Drinks"
          - Coffee shops, tea brands go in "Coffee & Tea"
          - Crisps, nuts, popcorn, snack bars go in "Snacks & Crisps"
          - Chocolate, sweets, candy, desserts go in "Confectionery"
          - Bread, pastries, cakes, biscuits go in "Bakery & Bread"
          - Milk, cheese, yogurt, dairy alternatives go in "Dairy & Alternatives"
          - Restaurants, cafes, casual dining chains go in "Casual Dining & Restaurants"
          - Supermarkets, grocery, food manufacturers, condiments go in "Grocery & Food Brands"
          - Supplements, health foods, wellness brands go in "Health & Wellness Food"
          - Baby food, toddler food go in "Baby & Kids Food"
          - Anything that doesn't clearly fit goes in "Other"
          
          Respond with ONLY the category name, nothing else.`;

          const message = await client.messages.create({
                  model: "claude-3-5-haiku-20241022",
                  max_tokens: 50,
                  messages: [{ role: "user", content: prompt }],
          });

          const raw = (message.content[0] as { text: string }).text.trim();
          const category = CATEGORIES.includes(raw as BrandCategory)
            ? (raw as BrandCategory)
                  : "Other";

          return NextResponse.json({ category });
    } catch (err) {
          console.error("Categorise error:", err);
          return NextResponse.json({ error: "Failed to categorise" }, { status: 500 });
    }
}