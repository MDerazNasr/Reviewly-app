export interface Business {
  id: string;
  client_name: string;
  business_name: string;
  client_email: string;
  theme_colour: string;
  google_reviews_link: string;
  keywords: string;
}

export interface Keyword {
  id: string;
  keyword: string;
}