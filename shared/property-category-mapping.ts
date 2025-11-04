/**
 * Property Type to Category Mapping
 * Maps propertyType values to their display categories and pages
 */

export type PropertyType =
  | "residential"
  | "commercial"
  | "plot"
  | "agricultural"
  | "pg";
export type CategoryPage =
  | "buy"
  | "rent"
  | "commercial"
  | "agricultural"
  | "pg";

export interface CategoryMapping {
  propertyType: PropertyType;
  categoryPage: CategoryPage;
  displayName: string;
  description: string;
}

/**
 * Master mapping of property types to categories
 */
export const PROPERTY_TYPE_TO_CATEGORY: Record<PropertyType, CategoryMapping> =
  {
    residential: {
      propertyType: "residential",
      categoryPage: "buy",
      displayName: "Residential",
      description:
        "Apartments, houses, villas, and other residential properties",
    },
    commercial: {
      propertyType: "commercial",
      categoryPage: "commercial",
      displayName: "Commercial",
      description: "Shops, offices, warehouses, and commercial spaces",
    },
    plot: {
      propertyType: "plot",
      categoryPage: "buy",
      displayName: "Plot/Land",
      description: "Residential plots, commercial plots, and land",
    },
    agricultural: {
      propertyType: "agricultural",
      categoryPage: "agricultural",
      displayName: "Agricultural",
      description: "Agricultural land, farms, and farmhouses",
    },
    pg: {
      propertyType: "pg",
      categoryPage: "pg",
      displayName: "PG/Hostel",
      description: "Paying guest accommodations and hostels",
    },
  };

/**
 * Sub-categories for each property type
 */
export const PROPERTY_SUBCATEGORIES: Record<
  PropertyType,
  Array<{ value: string; label: string }>
> = {
  residential: [
    { value: "1bhk", label: "1 BHK Apartment" },
    { value: "2bhk", label: "2 BHK Apartment" },
    { value: "3bhk", label: "3 BHK Apartment" },
    { value: "4bhk-plus", label: "4+ BHK Apartment" },
    { value: "independent-house", label: "Independent House" },
    { value: "villa", label: "Villa" },
    { value: "duplex", label: "Duplex" },
    { value: "penthouse", label: "Penthouse" },
  ],
  commercial: [
    { value: "shop", label: "Shop" },
    { value: "office", label: "Office Space" },
    { value: "showroom", label: "Showroom" },
    { value: "warehouse", label: "Warehouse" },
    { value: "factory", label: "Factory" },
    { value: "restaurant-space", label: "Restaurant Space" },
  ],
  plot: [
    { value: "residential-plot", label: "Residential Plot" },
    { value: "commercial-plot", label: "Commercial Plot" },
    { value: "agricultural-land", label: "Agricultural Land" },
    { value: "industrial-plot", label: "Industrial Plot" },
    { value: "farm-house", label: "Farm House Plot" },
  ],
  agricultural: [
    { value: "agricultural-land", label: "Agricultural Land / Farmland" },
    { value: "farmhouse-with-land", label: "Farmhouse with Land" },
    { value: "orchard-plantation", label: "Orchard / Plantation" },
    { value: "dairy-farm", label: "Dairy Farm" },
    { value: "poultry-farm", label: "Poultry Farm" },
    { value: "fish-farm-pond", label: "Fish/Prawn Farm / Pond" },
    { value: "polyhouse-greenhouse", label: "Polyhouse / Greenhouse" },
    { value: "pasture-grazing", label: "Pasture / Grazing Land" },
    { value: "horticulture-land", label: "Horticulture Land" },
    { value: "vineyard", label: "Vineyard" },
    { value: "farm-plot-weekend", label: "Farm Plot / Weekend Farm" },
    { value: "agri-cold-storage", label: "Agri Storage Shed / Cold Storage" },
  ],
  pg: [
    { value: "boys-hostel", label: "Boys Hostel" },
    { value: "girls-hostel", label: "Girls Hostel" },
    { value: "co-living", label: "Co-Living Space" },
    { value: "shared-apartment", label: "Shared Apartment" },
  ],
};

/**
 * Get the category page for a property type
 */
export function getCategoryPageForPropertyType(
  propertyType: string,
): CategoryPage {
  const mapping = PROPERTY_TYPE_TO_CATEGORY[propertyType as PropertyType];
  return mapping?.categoryPage || "buy"; // Default to 'buy'
}

/**
 * Get the display name for a property type
 */
export function getPropertyTypeDisplayName(propertyType: string): string {
  const mapping = PROPERTY_TYPE_TO_CATEGORY[propertyType as PropertyType];
  return mapping?.displayName || propertyType;
}

/**
 * Get sub-categories for a property type
 */
export function getSubCategoriesForPropertyType(propertyType: string) {
  return PROPERTY_SUBCATEGORIES[propertyType as PropertyType] || [];
}

/**
 * Check if a property should be displayed on a specific category page
 */
export function shouldDisplayPropertyOnPage(
  propertyType: string,
  currentPage: CategoryPage,
): boolean {
  const categoryPage = getCategoryPageForPropertyType(propertyType);

  // Handle special case: both residential and plot types show on /buy
  if (currentPage === "buy") {
    return propertyType === "residential" || propertyType === "plot";
  }

  return categoryPage === currentPage;
}

/**
 * Get all property types that display on a specific category page
 */
export function getPropertyTypesForCategoryPage(
  categoryPage: CategoryPage,
): PropertyType[] {
  const types: PropertyType[] = [];

  for (const [propType, mapping] of Object.entries(PROPERTY_TYPE_TO_CATEGORY)) {
    if (mapping.categoryPage === categoryPage) {
      types.push(propType as PropertyType);
    }
  }

  // Special handling for 'buy' page - includes both residential and plot
  if (categoryPage === "buy") {
    return ["residential", "plot"] as PropertyType[];
  }

  return types;
}
