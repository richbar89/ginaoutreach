export interface PostMetrics {
  views: number;
  likes: number;
  comments: number;
  followers: number;
}

export interface ViralScoreResult {
  signal1: number;       // views/followers score (0–100)
  signal2: number;       // likes/followers score (0–100)
  signal3: number;       // comments/followers score (0–100)
  total: number;         // weighted combined score
  flagged: boolean;      // true if total > 65
  viewsFollowersRatio: number;
  likeRate: number;      // as percentage
  commentRate: number;   // as percentage
}

// Benchmarks: what "perfect 100" looks like for each signal
const BENCHMARKS = {
  viewsFollowersRatio: 3.0,  // 3× follower count in views = 100pts
  likeRate: 0.08,            // 8% of followers liked = 100pts
  commentRate: 0.005,        // 0.5% of followers commented = 100pts
};

// Weights
const WEIGHTS = { signal1: 0.40, signal2: 0.35, signal3: 0.25 };

export function calculateViralScore(metrics: PostMetrics): ViralScoreResult {
  const { views, likes, comments, followers } = metrics;

  if (!followers || followers === 0) {
    return {
      signal1: 0, signal2: 0, signal3: 0, total: 0, flagged: false,
      viewsFollowersRatio: 0, likeRate: 0, commentRate: 0,
    };
  }

  const viewsFollowersRatio = views / followers;
  const likeRate = likes / followers;
  const commentRate = comments / followers;

  const signal1 = Math.min(100, (viewsFollowersRatio / BENCHMARKS.viewsFollowersRatio) * 100);
  const signal2 = Math.min(100, (likeRate / BENCHMARKS.likeRate) * 100);
  const signal3 = Math.min(100, (commentRate / BENCHMARKS.commentRate) * 100);

  const total =
    signal1 * WEIGHTS.signal1 +
    signal2 * WEIGHTS.signal2 +
    signal3 * WEIGHTS.signal3;

  return {
    signal1: Math.round(signal1 * 10) / 10,
    signal2: Math.round(signal2 * 10) / 10,
    signal3: Math.round(signal3 * 10) / 10,
    total: Math.round(total * 10) / 10,
    flagged: total > 65,
    viewsFollowersRatio: Math.round(viewsFollowersRatio * 100) / 100,
    likeRate: Math.round(likeRate * 10000) / 100,
    commentRate: Math.round(commentRate * 10000) / 100,
  };
}
