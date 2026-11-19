export type Profile = {
  id: string;
  display_name: string;
  bio: string | null;
  image_url: string | null;
  aura: number;
  vote_count: number;
  created_at: string;
  hidden: boolean;
  report_count: number;
};

export type LeaderboardPayload = {
  profiles: Profile[];
  updatedAt: string;
};
