export type CastleType = 'castle' | 'palace' | 'fortress' | 'chateau' | 'manor' | 'ruins';
export type ContentStatus = 'published' | 'draft' | 'coming_soon';

export interface OpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  seasonal_note?: string;
}

export interface MediaItem {
  url: string;
  alt: string;
  credit?: string;
  width?: number;
  height?: number;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Castle {
  id: string;
  name: string;
  local_name?: string;
  type: CastleType;
  status: ContentStatus;
  featured: boolean;
  priority_score: number;
  annual_visitors?: number;

  country: string;
  region?: string;
  nearest_city?: string;
  address?: string;
  lat: number;
  lng: number;
  unesco: boolean;

  opening_hours?: OpeningHours;
  price_adult?: number;
  price_child?: number;
  booking_required?: boolean;
  official_tickets_url?: string;
  visit_duration?: string;
  best_season?: string;
  accessibility?: string;
  booking_advance_days?: number;

  tagline: string;
  highlights: string[];
  description: string;
  history: string;
  how_to_visit?: string;
  faqs?: FAQ[];

  year_built?: number;
  architectural_style?: string;

  hero_image: MediaItem;
  gallery?: MediaItem[];
  og_image?: string;
  instagram_tag?: string;

  meta_title?: string;
  meta_description?: string;
  tags: string[];
  last_updated: string;

  routes: string[];
  nearby_castles?: string[];

  gyg_location_id?: string;
  gyg_search_query?: string;
  gyg_widget_type?: 'activities' | 'tours' | 'all';
  gyg_num_results?: number;
  gyg_featured_tours?: {
    tour_id: string;
    url?: string; // Full GYG activity URL (city-slug + location id + tour slug); partner_id appended at render time. Falls back to /activity/{tour_id}/ when absent.
    title: string;
    type: 'day_trip' | 'guided_tour' | 'skip_the_line' | 'multi_day' | 'entry_ticket';
    duration: string;
    price_from: number;
    rating: number | null;
    reviews: number;
    is_top_pick?: boolean;
    covers_castles?: string[];
  }[];
}

export interface Country {
  slug: string;
  name: string;
  description: string;
  hero_image: MediaItem;
  thumbnail_image?: MediaItem;
  castle_count?: number;
  highlights?: string[];
}

export interface Route {
  id: string;
  name: string;
  tagline: string;
  description: string;
  hero_image: MediaItem;
  thumbnail_image?: MediaItem;
  countries: string[];
  castles: string[];
  distance_km?: number;
  duration_days?: string;
  difficulty?: 'easy' | 'moderate' | 'challenging';
  map_center?: { lat: number; lng: number };
  tags?: string[];
  gyg_search_query?: string;
}

export interface Guide {
  id: string;
  title: string;
  meta_title?: string;
  meta_description?: string;
  hero_image: MediaItem;
  thumbnail_image?: MediaItem;
  country?: string;
  route?: string;
  castles: string[];
  content: string;
  published_date: string;
  last_updated: string;
  tags?: string[];
}

export interface CountryStats {
  total: number;
  featured: number;
  unesco: number;
  topCastle?: Castle;
}
