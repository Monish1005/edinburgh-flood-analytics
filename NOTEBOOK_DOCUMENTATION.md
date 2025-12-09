# 🌊 Scotland Flood Damage Analysis - Notebook Documentation

## Overview

This Jupyter notebook (`flood_damage_analysis.ipynb`) performs a comprehensive flood risk and damage assessment for Edinburgh, Scotland by integrating multiple geospatial datasets:

- **SEPA River Flood Maps** (extent + depth data)
- **Ordnance Survey Buildings** (detailed building properties)  
- **Scottish Index of Multiple Deprivation (SIMD)** (socio-economic data)
- **Property Value Data** (average prices by postcode sector)

The analysis uses **EU Flood Damage Curves** to estimate financial losses across different flood probability scenarios.

---

## Table of Contents

1. [Data Sources](#data-sources)
2. [Notebook Structure](#notebook-structure)
3. [Key Features](#key-features)
4. [Requirements](#requirements)
5. [Usage Instructions](#usage-instructions)
6. [Outputs](#outputs)
7. [Methodology](#methodology)

---

## Data Sources

### 1. SEPA River Flood Maps (v3.0)
- **Source**: Scottish Environment Protection Agency
- **File**: `SEPA_River_Flood_Maps_v3_0/Data/FRM_River_Flood_Hazard_Layers_v3_0.gdb`
- **Layers Used**:
  - Flood extent layers (High/Medium/Low probability)
  - Flood depth layers (High/Medium/Low probability)
- **Probability Scenarios**:
  - **High (H)**: 1 in 10 year event
  - **Medium (M)**: 1 in 200 year event  
  - **Low (L)**: 1 in 1000 year event

### 2. Ordnance Survey Buildings
- **File**: `Building_Property_Datasets/ngd-bld_6136032/ngd-bld_6136032.gpkg`
- **Layer**: `Building`
- **Contains**: ~78,000 buildings in Edinburgh area with detailed attributes:
  - Building use and residential unit counts
  - Construction materials
  - Building age
  - Height and floor information
  - Roof characteristics

### 3. SIMD Data (2020)
- **File**: `SG_SIMD_2020/SG_SIMD_2020.shp`
- **Contains**: Deprivation indicators including:
  - Income and employment statistics
  - Health and education metrics
  - Geographic access scores
  - Crime rates
  - Housing quality indicators

### 4. Property Values
- **File**: `Average price of residential units(£).xlsx`
- **Contains**: Average residential property prices by postcode sector

---

## Notebook Structure

### Step 1: Setup and Imports
**Libraries Used**:
- `geopandas` - Geospatial data handling
- `pandas` - Data manipulation
- `numpy` - Numerical operations
- `matplotlib` - Plotting
- `folium` - Interactive mapping

### Step 2: Load SEPA Flood Data
- Loads flood extent and depth layers for all three probability scenarios
- Uses Edinburgh bounding box (320000, 660000, 340000, 680000) to filter data
- Reprojects all data to EPSG:4326 (WGS84)
- **GRIDCODE to Depth Mapping**:
  - `1`: < 0.3m
  - `2`: 0.3m - 1.0m
  - `3`: > 1.0m
  - `999`: Data not available

### Step 3: Load OS Buildings Data
- Loads ~78,099 buildings within Edinburgh area
- Reprojects from EPSG:27700 to EPSG:4326
- Key fields: geometry, residential unit counts, building use

### Step 4: Load SIMD Deprivation Data
- Loads 693 SIMD zones
- Contains socio-economic indicators
- Enables analysis of flood risk by deprivation level

### Step 5: Spatial Analysis - Buildings in Flood Zones
**Process**:
1. Creates `buildings_risk` dataset with risk flags
2. Performs spatial joins to identify buildings intersecting flood zones
3. Results:
   - High risk: 314 buildings
   - Medium risk: 1,395 buildings
   - Low risk: 3,376 buildings
   - **Total at risk**: 3,404 buildings (4.4%)

### Step 6: Extract Depth Values (GRIDCODE)
- Uses building centroids for point-in-polygon analysis
- Extracts GRIDCODE values for each scenario
- Calculates maximum GRIDCODE across all scenarios
- **Distribution** (worst case):
  - GRIDCODE 1 (< 0.3m): 1,091 buildings
  - GRIDCODE 2 (0.3-1.0m): 1,005 buildings
  - GRIDCODE 3 (> 1.0m): 671 buildings
  - GRIDCODE 999 (No data): 43 buildings

### Step 7: Calculate Flood Damage
**GRIDCODE-Based Damage Functions**:

| GRIDCODE | Residential | Commercial | Other |
|----------|-------------|------------|-------|
| 1 (< 0.3m) | 25% | 25% | 10% |
| 2 (0.3-1.0m) | 40% | 45% | 20% |
| 3 (> 1.0m) | 75% | 70% | 35% |

**Process**:
1. Links buildings to postcode sectors via spatial join
2. Merges property price data by postcode sector
3. Calculates damage per unit: `property_value × damage_factor`
4. Multiplies by residential unit count per building
5. Computes damage for each scenario (H, M, L)

**Damage Summary**:

| Scenario | Buildings | Units | Total Damage | Avg/Building | Avg/Unit |
|----------|-----------|-------|--------------|--------------|----------|
| **High (1 in 10yr)** | 67 | 322 | £36.99M | £552,046 | £114,867 |
| **Medium (1 in 200yr)** | 573 | 2,068 | £218.29M | £380,957 | £105,555 |
| **Low (1 in 1000yr)** | 1,807 | 6,819 | £920.32M | £509,306 | £134,964 |

**Top 5 Sectors by Damage (Low Scenario)**:
1. EH 7 4: £226.57M (1,095 units)
2. EH 3 5: £169.23M (910 units)
3. EH11 3: £85.26M (1,813 units)
4. EH 4 1: £72.47M (813 units)
5. EH12 6: £71.31M (131 units)

### Step 8: Visualizations
1. **Interactive Folium Map** (`flood_damage_map.html`):
   - Flood zones by probability
   - Building footprints colored by damage
   - Popup information with damage details

2. **Damage Comparison Charts**:
   - Bar chart showing total damage by scenario
   - Sector-level damage breakdowns

---

## Key Features

### 💡 Highlights
- ✅ **Scenario-Based Analysis**: Separate calculations for H, M, L probability
- ✅ **Unit-Level Damage**: Accounts for multiple units per building
- ✅ **Postcode Integration**: Links to property prices by sector
- ✅ **Interactive Visualization**: Folium maps with damage overlays
- ✅ **Data Validation**: Checks for missing price data coverage

### 🎯 Analysis Capabilities
- Identify buildings at flood risk by probability
- Estimate financial damage using EU damage curves
- Compare damage across different return periods
- Analyze spatial patterns of flood risk
- Export processed data for further analysis

---

## Requirements

### Python Libraries
```python
geopandas==1.1.1
pandas==2.2.2
numpy
matplotlib
folium
mapclassify
branca
openpyxl  # For Excel file reading
```

### Installation
```bash
pip install geopandas pandas numpy matplotlib folium mapclassify branca openpyxl
```

---

## Usage Instructions

### 1. Data Preparation
Ensure all data files are in the correct directories:
```
/Users/monish/Documents/flood/
├── SEPA_River_Flood_Maps_v3_0/
├── Building_Property_Datasets/
├── SG_SIMD_2020/
├── GB_Postcodes/
└── Average price of residential units(£).xlsx
```

### 2. Running the Notebook
1. Open Jupyter Notebook/Lab
2. Navigate to `flood_damage_analysis.ipynb`
3. Run cells sequentially (Shift + Enter)
4. The notebook should take ~5-10 minutes to complete

### 3. Output Files Generated
- `flood_damage_map.html` - Interactive damage map
- `processed_data/buildings_with_flood_risk.gpkg` - GeoPackage with all results

### 4. Loading Pre-Processed Data
To skip the lengthy processing steps:
```python
buildings_risk = gpd.read_file('processed_data/buildings_with_flood_risk.gpkg')
at_risk = buildings_risk[buildings_risk['any_flood_risk']]
```

---

## Outputs

### 1. GeoPackage Output
**File**: `processed_data/buildings_with_flood_risk.gpkg`
**Size**: ~124 MB
**Contains**: All 78,099 buildings with added fields:
- `flood_risk_h`, `flood_risk_m`, `flood_risk_l` (Boolean flags)
- `gridcode_h`, `gridcode_m`, `gridcode_l` (Depth categories)
- `max_gridcode`, `max_depth_m` (Worst case values)
- `damage_h`, `damage_m`, `damage_l` (Estimated damage £)
- `damage_max` (Maximum damage across scenarios)
- `postcode_sector`, `property_value`
- `residential_units` (Count of residential addresses)
- `any_flood_risk` (Boolean flag for any risk)

### 2. Interactive Map
**File**: `flood_damage_map.html`
**Features**:
- Layer control for flood zones (H/M/L)
- Buildings colored by damage severity
- Click popups with:
  - Residential unit count
  - Postcode sector
  - Damage by scenario
  - Maximum damage estimate

---

## Methodology

### Spatial Join Process
1. **Buildings → Flood Extent**: Identifies which buildings intersect flood zones
2. **Building Centroids → Depth Layers**: Extracts flood depth (GRIDCODE)
3. **Buildings → Postcode Sectors**: Links to property price data
4. **Buildings → SIMD Zones**: Adds deprivation indicators

### Damage Calculation Formula
For each building:
```
damage = property_value × damage_factor(GRIDCODE) × residential_units
```

Where:
- `property_value` = average price in that postcode sector
- `damage_factor(GRIDCODE)` = percentage damage based on flood depth
- `residential_units` = number of residential addresses in building

### Data Quality Notes
- **Property Price Coverage**: 26 postcode sectors with price data
- **Exposed Sectors**: All 23 flood-exposed sectors have price data (100% coverage)
- **Buildings with Damage Estimates**: 1,814 buildings (~53% of at-risk buildings)
- **Missing Data**: Some buildings lack postcode sector linkage

---

## Technical Notes

### Coordinate Systems
- **Input CRS**: EPSG:27700 (British National Grid)
- **Working CRS**: EPSG:4326 (WGS84)
- All data is reprojected to WGS84 for analysis

### Performance Optimizations
- Uses bounding box filtering for initial data load
- Simplifies geometries for web visualization
- Samples buildings (max 5,000) for interactive maps
- Pre-calculates results and saves to GeoPackage

### Assumptions
- Property values are homogeneous within postcode sectors
- EU damage curves are appropriate for Scottish context
- Depth categories (GRIDCODE) are accurate proxies for actual depths
- Residential unit counts reflect current occupancy

---

## Future Enhancements

Potential additions to the analysis:
1. **Granular Depth Values**: Use continuous depth instead of GRIDCODE categories
2. **Commercial Damage**: Expand to non-residential properties
3. **Content Damage**: Add analysis of household contents damage
4. **Risk Scores**: Incorporate probability weighting (AAL - Average Annual Loss)
5. **Deprivation Analysis**: Cross-tabulate damage by SIMD quintiles
6. **Evacuation Analysis**: Identify vulnerable populations
7. **Temporal Analysis**: Track changes over multiple data releases

---

## References

- **SEPA Flood Maps**: [SEPA Flood Maps](https://www.sepa.org.uk/environment/water/flooding/flood-maps/)
- **OS Buildings**: Ordnance Survey National Geographic Database
- **SIMD**: [Scottish Index of Multiple Deprivation 2020](https://www.gov.scot/collections/scottish-index-of-multiple-deprivation-2020/)
- **EU Damage Curves**: Based on European flood damage assessment methodologies

---

## Support

For questions or issues with this analysis:
- Check data file paths and formats
- Ensure all required libraries are installed
- Verify CRS transformations are working correctly
- Review intermediate outputs for data quality

---

**Last Updated**: November 2025
**Analysis Region**: Edinburgh, Scotland
**Flood Scenarios**: 1 in 10, 1 in 200, 1 in 1000 year events
