-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

-- Influencers to monitor
CREATE TABLE IF NOT EXISTS trend_influencers (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  handle          text        NOT NULL UNIQUE,
  followers       integer,
  niche           text,
  active          boolean     NOT NULL DEFAULT true,
  last_scraped_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Scraped posts with viral scores
CREATE TABLE IF NOT EXISTS trend_posts (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_handle     text        NOT NULL,
  post_id               text        NOT NULL UNIQUE,
  post_url              text,
  thumbnail_url         text,
  caption               text,
  media_type            text,        -- REEL | CAROUSEL | IMAGE
  posted_at             timestamptz,
  scraped_at            timestamptz NOT NULL DEFAULT now(),
  followers_at_scrape   integer,
  views                 integer     NOT NULL DEFAULT 0,
  likes                 integer     NOT NULL DEFAULT 0,
  comments              integer     NOT NULL DEFAULT 0,
  views_followers_ratio float,
  like_rate             float,
  comment_rate          float,
  signal1               float,
  signal2               float,
  signal3               float,
  viral_score           float,
  flagged               boolean     NOT NULL DEFAULT false,
  notes                 text,
  days_old              integer
);

-- Indexes for dashboard performance
CREATE INDEX IF NOT EXISTS idx_trend_posts_handle      ON trend_posts(influencer_handle);
CREATE INDEX IF NOT EXISTS idx_trend_posts_viral_score ON trend_posts(viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_trend_posts_flagged     ON trend_posts(flagged);
CREATE INDEX IF NOT EXISTS idx_trend_posts_posted_at   ON trend_posts(posted_at DESC);

-- Refresh run log
CREATE TABLE IF NOT EXISTS trend_refresh_log (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  status     text        NOT NULL DEFAULT 'running', -- running | done | failed
  posts_saved integer,
  posts_flagged integer,
  apify_run_id text,
  error      text
);
