export interface TourStop {
  order: number;
  castle_id?: string;
  castle_name: string;
  duration: string;
  description: string;
}

export interface TourFAQ {
  question: string;
  answer: string;
}

export interface Tour {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  departure_country: string;
  departure_city: string;
  visited_countries: string[];
  duration_days: number;
  duration_label: string;
  gyg_tour_id: string;
  gyg_url: string;
  price_from: number;
  currency: string;
  rating: number;
  review_count: number;
  languages: string[];
  max_group_size: number;
  overview: string;
  highlights: string[];
  itinerary: TourStop[];
  included: string[];
  excluded: string[];
  meeting_point: string;
  tips: string[];
  faqs: TourFAQ[];
  featured: boolean;
  hero_image: { url: string; alt: string };
  meta: { title: string; description: string };
}

export interface TourCountry {
  slug: string;
  name: string;
  tour_count: number;
  hero_image: { url: string; alt: string };
}
