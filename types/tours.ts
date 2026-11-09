export interface TourStop {
  order: number;
  castle_id?: string;
  castle_name: string;
  duration: string;
  description: string;
  // A stop with no castle page normally links to a GetYourGuide search for its name; plain: true shows the
  // name as plain text (a pickup point, for example, is not worth a search link).
  plain?: boolean;
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
  price_from: number | null;
  currency: string;
  rating: number | null;
  review_count: number;
  languages: string[];
  max_group_size: number;
  // Overrides on the tour page: the "Group size" text (e.g. "Private, up to 8 people") and the group size the
  // price covers (e.g. "from €1,140 per group of up to 4"), when they differ from max_group_size.
  group_size_label?: string;
  price_group_size?: number;
  pricing_unit?: 'person' | 'group';
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
