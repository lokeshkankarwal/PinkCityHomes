export interface Property {
  id: string;
  sellerId?: string;
  title: string;
  description: string;
  propertyType: "APARTMENT" | "VILLA" | "INDEPENDENT_HOUSE" | "PLOT" | "BUILDER_FLOOR";
  bhk: number;
  bathrooms: number;
  price: number;
  carpetArea: number;
  superBuiltUpArea?: number;
  furnishing: "UNFURNISHED" | "SEMI_FURNISHED" | "FULLY_FURNISHED";
  floor?: number;
  totalFloors?: number;
  parking?: number;
  address: string;
  locality: string;
  city: string;
  latitude: number;
  longitude: number;
  contactName?: string;
  contactPhone?: string;
  listingType?: "BUY" | "RENT";
  projectName?: string;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "SOLD";
  views?: number;
  createdAt?: string;
  images?: { id: string; path: string; isPrimary: boolean; sortOrder: number }[];
  primaryImage?: string;
  seller?: {
    id?: string;
    sellerProfileId?: string;
    name: string;
    companyName?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    status?: string;
    memberSince?: string;
    totalProperties?: number;
  };
}

export interface Project {
  id: string;
  sellerId?: string;
  name: string;
  developerName: string;
  locality: string;
  city: string;
  address?: string;
  description?: string;
  totalUnits: number;
  totalTowers?: number;
  amenities: string[];
  image?: string;
  createdAt?: string;
  unitsCount?: number;
  buyUnitsCount?: number;
  rentUnitsCount?: number;
  units?: Property[];
}

export interface ProjectDetail {
  project_id: string;
  apartment_name: string;
  developer_name?: string;
  locality: string;
  city: string;
  address?: string;
  description?: string;
  project_status?: string;
  total_units?: number;
  total_towers?: number;
  total_listings?: number;
  price_min?: number;
  price_max?: number;
  min_area_sqft?: number;
  max_area_sqft?: number;
  amenities?: string[];
  image?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  saleUnits?: Property[];
  rentUnits?: Property[];
  allUnits?: Property[];
}
