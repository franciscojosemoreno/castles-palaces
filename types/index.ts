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

export interface CastleHotel {
  is_hotel: boolean;
  visitable_by_public: boolean;
  hotel_name: string;
  booking_url: string;
  price_from_night: number | null;
  currency: string;
  star_category?: number;
  room_count?: number;
  source?: string;
  sourced_date?: string;
  room_location?: 'castle' | 'annex' | 'mixed' | 'convent' | 'village';
  amenities?: string[];
  non_guest_access_note?: string;
  how_to_stay?: string;
  price_unit?: 'night' | 'person' | 'property';
  max_guests?: number;
  booking_paused?: boolean;
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
  price_currency?: string; // ISO code for price_adult/price_child, e.g. "GBP" for a UK site. Defaults to EUR when absent.
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
  // Used only when the castle's own text supports a century of origin but not a precise
  // year — e.g. 12 for "12th century". Never set alongside year_built.
  built_century?: number;
  // Free-text override for origin dates neither year_built nor built_century can express
  // correctly (BC spans, ranges) — e.g. "4th century BC". Takes priority over both when set.
  built_label?: string;
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
  gyg_direct_link_override?: boolean;
  gyg_featured_tours?: {
    tour_id: string;
    url?: string;
    booking_url_override?: string; // When present, used as the booking button href instead of the search-URL generator. Per-castle exception only.
    title: string;
    type: 'day_trip' | 'guided_tour' | 'skip_the_line' | 'multi_day' | 'entry_ticket' | 'boat_tour' | 'entrance_ticket';
    duration: string;
    price_from: number;
    rating: number | null;
    reviews: number;
    is_top_pick?: boolean;
    pricing_unit?: 'person' | 'group';
    covers_castles?: string[];
    // True when price_from is a multi-site pass/card price, not an entry price for
    // this castle alone — display logic must not present it as the castle's ticket.
    multi_site_pass?: boolean;
    pass_sites_count?: string; // e.g. "25+" or "3", only when GYG's own listing states a count
    pass_label?: string; // card copy "{pass_label} available", e.g. "Heritage Pass"; defaults to "Pass"
    pass_badge_label?: string; // FEATURED TOUR badge text, e.g. "City card"; defaults to "Multi-site pass"
  }[];

  hotel?: CastleHotel;
}

export interface Country {
  slug: string;
  name: string;
  description: string;
  hero_image: MediaItem;
  thumbnail_image?: MediaItem;
  castle_count?: number;
  highlights?: string[];

  // Opt-in SEO hub sections (country-hub pilot). Absent/false preserves the
  // existing generic hub behaviour; set per-country to extend the recipe.
  show_seo_sections?: boolean;
  seo_title_override?: string; // use "{N}" as a placeholder for the live castle count
  seo_description_override?: string;
  intro_paragraph_2?: string; // use "{N}" as a placeholder for the live castle count
  hub_faqs?: FAQ[]; // answers may use [text](/castles/...) markdown links
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
