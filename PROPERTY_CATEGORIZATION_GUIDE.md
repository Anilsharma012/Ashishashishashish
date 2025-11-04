# Property Categorization System Guide

## Overview

This guide explains how properties are automatically categorized and displayed on the correct category pages (Buy, Rent, Commercial, Agricultural, PG/Hostel) based on the property type selected by the seller.

## How It Works

### 1. Property Creation
When a user posts a property via `/api/properties` (POST endpoint in `server/routes/properties.ts`), they select:
- **Property Type**: The main category (residential, commercial, plot, agricultural, pg)
- **Sub Category**: Specific type within that category (1bhk, shop, etc.)
- **Price Type**: Whether it's for sale or rent
- **Price**: The listing price

### 2. Property Approval Flow
```
User posts property
    ↓
Property created with status="inactive", approvalStatus="pending"
    ↓
Admin reviews in "Pending Properties" section
    ↓
Admin approves property
    ↓
Server updates: status="active", approvalStatus="approved"
    ↓
Property now visible on public pages (filters: status="active" AND approvalStatus="approved")
```

### 3. Category Mapping
Properties are automatically displayed on category pages based on their `propertyType` and `priceType`:

| Category Page | Property Type | Price Type | API Endpoint |
|---|---|---|---|
| **Buy** | residential OR plot | sale | `/properties?category=buy` |
| **Rent** | residential | rent | `/properties?category=rent` |
| **Commercial** | commercial | any | `/properties?category=commercial` |
| **Agricultural** | agricultural | any | `/properties?category=agricultural` |
| **PG/Hostel** | pg | any | `/properties?category=pg` |

### 4. Subcategory Display
Subcategories are dynamically retrieved from:
- **API Endpoint**: `/categories/{category}/subcategories`
- **Logic**: Only shows subcategories that have approved properties with that subcategory
- **Database**: 
  - Main categories stored in `categories` collection
  - Each category has an array of subcategories
  - Properties matched by querying `properties` collection with status="active" AND approvalStatus="approved"

## Database Schema

### Categories Collection
```javascript
{
  _id: ObjectId,
  name: "Buy",
  slug: "buy",
  description: "Buy properties - apartments, houses, plots and more",
  propertyTypes: ["residential", "plot"],  // Which propertyTypes belong here
  priceTypes: ["sale"],                    // Which price types (if applicable)
  sortOrder: 1,
  isActive: true,
  subcategories: [                         // Embedded array
    {
      name: "1 BHK",
      slug: "1bhk",
      description: "1 Bedroom apartments"
    },
    // ... more subcategories
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Properties Collection
```javascript
{
  _id: ObjectId,
  title: "Spacious 2 BHK Apartment",
  propertyType: "residential",     // Determines which category to show on
  subCategory: "2bhk",              // Which subcategory within that category
  priceType: "sale",                // sale, rent, or lease
  status: "active",                 // "active" or "inactive"
  approvalStatus: "approved",       // "pending", "approved", or "rejected"
  // ... other properties
}
```

## Key Code Files

### Frontend
- `client/pages/Buy.tsx` - Buy page showing residential + plot subcategories
- `client/pages/Commercial.tsx` - Commercial page showing commercial subcategories
- `client/pages/PostProperty.tsx` - Property creation form with property type selection
- `client/components/admin/PendingPropertiesApproval.tsx` - Admin approval UI

### Backend
- `server/routes/properties.ts`
  - `getProperties()` - Lists properties with category filtering
  - `createProperty()` - Creates new property (sets propertyType from form)
  - `updatePropertyApproval()` - Admin approves/rejects (sets status="active")

- `server/routes/subcategories.ts`
  - `getSubcategories()` - Returns subcategories with approved properties
  - `getSubcategoriesWithCounts()` - Returns subcategories with property counts

- `server/routes/admin.ts`
  - `updatePropertyApproval()` - Admin approval endpoint (sets status="active", approvalStatus="approved")

- `server/routes/init.ts`
  - `initializePropertyCategories()` - Creates/updates all category definitions

### Database Scripts
- `server/scripts/initializePropertyCategories.ts` - Can be run to initialize or reset categories

## Admin Approval Process

1. Admin navigates to "Pending Properties" section
2. Admin reviews property details (images, description, price, etc.)
3. Admin either:
   - **Approves**: Property status changes to "active", approvalStatus becomes "approved"
   - **Rejects**: Property status changes to "rejected", approvalStatus becomes "rejected" with reason

4. After approval:
   - Property appears on all relevant category pages
   - Property count badges update in real-time
   - Seller receives notification

## Testing the System

### Manual Testing
1. **Create a Property**:
   - Go to "Post Property" page
   - Select Property Type: "Residential"
   - Select Sub Category: "2 BHK"
   - Set Price Type: "Sale"
   - Fill in other details and submit

2. **Approve the Property**:
   - Go to Admin > Pending Properties
   - Find the newly created property
   - Click Approve
   - Fill in any admin comments (optional)
   - Confirm approval

3. **Verify Display**:
   - Go to /buy page
   - Verify the "2 BHK" subcategory now shows count = 1
   - Click on "2 BHK" to see the property listed
   - Go to /buy/2bhk to see detailed property listing

### Testing Different Property Types
- **Commercial Property**:
  - Create with propertyType: "commercial", subCategory: "shop"
  - Should appear on /commercial page only
  
- **Agricultural Property**:
  - Create with propertyType: "agricultural", subCategory: "agricultural-land"
  - Should appear on /agricultural page only

- **PG Property**:
  - Create with propertyType: "pg", subCategory: "boys-pg"
  - Should appear on /pg page only

## Troubleshooting

### Properties not appearing after approval
1. Check that property has:
   - `status: "active"` (not "inactive")
   - `approvalStatus: "approved"` (not "pending" or "rejected")
   - Valid `propertyType` (must be: residential, commercial, plot, agricultural, pg)
   - Valid `subCategory` (must match an existing subcategory)

2. Clear browser cache and refresh
3. Check `/properties?category=buy` API endpoint returns the property

### Subcategories not showing up
1. Verify approved properties exist with that subcategory
2. Check `propertyType` matches the category
3. Check `status` = "active" and `approvalStatus` = "approved"

### Categories not initialized
1. Call `/api/init` endpoint to initialize system
2. Or call `/api/seed` to seed with test data

## API Endpoints

### Public API
```
GET /properties                           - List properties with filters
GET /properties/:id                       - Get property details
GET /categories/:category/subcategories   - Get subcategories with counts
```

### Admin API (Requires Authentication)
```
PUT /admin/properties/:id/approval        - Approve/reject property
POST /api/properties                      - Create property
```

## Future Enhancements

- [ ] Auto-approve certain property types
- [ ] Property type validation rules
- [ ] Featured/premium properties handling
- [ ] Category-specific pricing tiers
- [ ] Location-based category filtering

## Quick Commands

### Initialize Categories via CLI
```bash
npm run ts-node server/scripts/initializePropertyCategories.ts
```

### Check Database State
```bash
# Connect to MongoDB and run:
db.categories.find().pretty()
db.properties.find({ status: "active", approvalStatus: "approved" }).count()
```
