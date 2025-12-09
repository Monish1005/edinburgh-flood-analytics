import geopandas as gpd
import pandas as pd
import numpy as np
import os

# --- Configuration ---
BUILDINGS_GPKG = 'processed_data/buildings_with_flood_risk.gpkg'
SIMD_SHP = 'SG_SIMD_2020/SG_SIMD_2020.shp'
PROPERTY_PRICES_XLSX = 'Average price of residential units(￡).xlsx'
OUTPUT_DIR = 'oracle_exports'

# Create output directory
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("🚀 Starting Oracle Export Process...")

# --- 1. Load Data ---
print(f"Loading Buildings from {BUILDINGS_GPKG}...")
buildings = gpd.read_file(BUILDINGS_GPKG)

print(f"Loading SIMD from {SIMD_SHP}...")
simd = gpd.read_file(SIMD_SHP)
# Ensure SIMD is in WGS84
if simd.crs != 'EPSG:4326':
    simd = simd.to_crs('EPSG:4326')

print(f"Loading Property Prices from {PROPERTY_PRICES_XLSX}...")
prices = pd.read_excel(PROPERTY_PRICES_XLSX)
prices.columns = ['Postcode_Sector', 'Avg_Price', 'Coverage', 'Source']
prices['Postcode_Sector'] = prices['Postcode_Sector'].str.strip()

# --- 2. Data Enrichment ---

# 2.0 Spatial Join with Postcode Sectors (Missing in GPKG)
POSTCODE_SECTORS_PATH = 'GB_Postcodes/PostalSector.shp'
print(f"Loading Postcode Sectors from {POSTCODE_SECTORS_PATH}...")
postcode_sectors = gpd.read_file(POSTCODE_SECTORS_PATH)
if postcode_sectors.crs != 'EPSG:4326':
    postcode_sectors = postcode_sectors.to_crs('EPSG:4326')

print("Linking Buildings to Postcode Sectors...")
# Use centroids for spatial join
buildings_centroid = buildings.copy()
buildings_centroid['geometry'] = buildings.geometry.centroid

buildings_with_sector = gpd.sjoin(
    buildings_centroid,
    postcode_sectors[['geometry', 'GISSect']], # GISSect is usually the sector name like 'EH1 1'
    how='left',
    predicate='within'
)

# Map back to main dataframe
buildings['postcode_sector'] = buildings_with_sector['GISSect']

# 2.1 Merge Property Prices
print("Merging Property Prices...")
# Ensure column names match for merge
buildings['postcode_sector'] = buildings['postcode_sector'].astype(str)
prices['Postcode_Sector'] = prices['Postcode_Sector'].astype(str)

buildings = buildings.merge(
    prices[['Postcode_Sector', 'Avg_Price']],
    left_on='postcode_sector',
    right_on='Postcode_Sector',
    how='left'
)
buildings['property_value'] = buildings['Avg_Price']

# 2.2 Spatial Join with SIMD (to get DataZone)
print("Linking Buildings to SIMD Zones...")
# Use centroids for spatial join to avoid duplication
# (buildings_centroid is already created above)

buildings_with_simd = gpd.sjoin(
    buildings_centroid,
    simd[['DataZone', 'Quintilev2', 'DZName', 'geometry']],
    how='left',
    predicate='within'
)

# Map DataZone back to main dataframe
buildings['DATAZONE'] = buildings_with_simd['DataZone']

# 2.3 Extract Flood Depths (GRIDCODE) - Missing in GPKG
SEPA_GDB = 'SEPA_River_Flood_Maps_v3_0/Data/FRM_River_Flood_Hazard_Layers_v3_0.gdb'
print(f"Loading Flood Depths from {SEPA_GDB}...")

# big brain logic
def get_max_valid_gridcode(join_df):
    """Get max GRIDCODE but prioritize valid depths (1, 2, 3) over No Data (999)."""
    if join_df.empty:
        return pd.Series(dtype=int)
    temp = join_df.copy()
    temp.loc[temp['GRIDCODE'] == 999, 'GRIDCODE'] = -1
    max_vals = temp.groupby(temp.index)['GRIDCODE'].max()
    return max_vals.replace(-1, 999)

depth_layers = {
    'h': 'FRM_FH_RIVER_DEPTH_H',
    'm': 'FRM_FH_RIVER_DEPTH_M',
    'l': 'FRM_FH_RIVER_DEPTH_L'
}

for scenario, layer_name in depth_layers.items():
    print(f"  Processing {scenario.upper()} depth layer...")
    # Read file (bbox filtering might be tricky if CRSs differ, let's read without bbox first or handle CRS)
    # Actually, let's check CRS of buildings first
    if buildings.crs != 'EPSG:27700':
        print(f"    Reprojecting buildings to EPSG:27700 for spatial join...")
        buildings_proj = buildings.to_crs('EPSG:27700')
    else:
        buildings_proj = buildings
        
    depth_data = gpd.read_file(SEPA_GDB, layer=layer_name, bbox=tuple(buildings_proj.total_bounds))
    
    # Ensure depth data is also 27700 (it should be)
    if depth_data.crs != 'EPSG:27700':
         depth_data = depth_data.to_crs('EPSG:27700')

    # Spatial join
    depth_join = gpd.sjoin(
        buildings_proj, # Use projected geometry
        depth_data[['GRIDCODE', 'geometry']],
        predicate='intersects',
        how='left'
    )
    
    # Extract max gridcode
    grid_col = f'gridcode_{scenario}'
    # We need to map the result back to the original 'buildings' dataframe
    # The index should be preserved by sjoin (left join on buildings_proj)
    buildings[grid_col] = get_max_valid_gridcode(depth_join)
    buildings[grid_col] = buildings[grid_col].fillna(0).astype(int)
    
    print(f"    Found {(buildings[grid_col] > 0).sum()} buildings with flood depth.")

# 2.4 Calculate Damages
print("Calculating Damages...")
buildings['residential_units'] = buildings['buildinguse_addresscount_residential'].fillna(0)

for scenario in ['h', 'm', 'l']:
    grid_col = f'gridcode_{scenario}'
    damage_col = f'damage_{scenario}'
    
    # Calculate damage
    # Damage = Value * Pct * Units
    
    # Vectorized calculation
    conditions = [
        buildings[grid_col] == 1,
        buildings[grid_col] == 2,
        buildings[grid_col] == 3
    ]
    choices = [0.25, 0.40, 0.75]
    damage_pct = np.select(conditions, choices, default=0.0)
    
    buildings[damage_col] = buildings['property_value'] * damage_pct * buildings['residential_units']
    
    # Handle NaNs (where property value is missing)
    buildings[damage_col] = buildings[damage_col].fillna(0)

# --- 3. Export: SIMD_ZONES ---
print("Exporting SIMD_ZONES...")
simd_export = simd[['DataZone', 'DZName', 'Quintilev2']].copy()
# Add population (SAPE2017 is Small Area Population Estimates)
if 'SAPE2017' in simd.columns:
    simd_export['POPULATION'] = simd['SAPE2017']
else:
    simd_export['POPULATION'] = 0 # Placeholder

simd_export.columns = ['DATAZONE', 'DZNAME', 'QUINTILEV2', 'POPULATION']
simd_export.to_csv(f'{OUTPUT_DIR}/simd_zones.csv', index=False)

# --- 4. Export: EDINBURGH_BUILDINGS ---
print("Exporting EDINBURGH_BUILDINGS...")
buildings_static = buildings[[
    'osid', 'postcode_sector', 'residential_units', 'property_value', 'DATAZONE'
]].copy()

# Add coordinates
buildings_static['EASTING'] = buildings.geometry.centroid.x
buildings_static['NORTHING'] = buildings.geometry.centroid.y

buildings_static.columns = ['OSID', 'POSTCODE_SECTOR', 'RESIDENTIAL_UNITS', 'PROPERTY_VALUE', 'DATAZONE', 'EASTING', 'NORTHING']
buildings_static.to_csv(f'{OUTPUT_DIR}/buildings_static.csv', index=False)

# --- 5. Export: FLOOD_DAMAGES (Wide to Long) ---
print("Exporting FLOOD_DAMAGES (Wide -> Long Transformation)...")

damage_rows = []

scenarios = {
    'HIGH': {'grid': 'gridcode_h', 'dmg': 'damage_h'},
    'MEDIUM': {'grid': 'gridcode_m', 'dmg': 'damage_m'},
    'LOW': {'grid': 'gridcode_l', 'dmg': 'damage_l'}
}

for scenario_name, cols in scenarios.items():
    print(f"  Processing {scenario_name} scenario...")
    # Filter for buildings with actual risk/damage in this scenario
    # (Optimization: don't store rows with 0 damage/risk to save space? 
    #  Actually plan says store all? Let's store if gridcode > 0 or damage > 0)
    subset = buildings[
        (buildings[cols['grid']] > 0) | (buildings[cols['dmg']] > 0)
    ].copy()
    
    subset_export = pd.DataFrame({
        'OSID': subset['osid'],
        'SCENARIO_ID': scenario_name,
        'GRIDCODE': subset[cols['grid']],
        'DAMAGE_ESTIMATE': subset[cols['dmg']]
    })
    
    damage_rows.append(subset_export)

all_damages = pd.concat(damage_rows)
all_damages.to_csv(f'{OUTPUT_DIR}/flood_damages.csv', index=False)

print(f"\n✅ Export Complete! Files saved to {OUTPUT_DIR}/")
print(f"   - simd_zones.csv: {len(simd_export)} rows")
print(f"   - buildings_static.csv: {len(buildings_static)} rows")
print(f"   - flood_damages.csv: {len(all_damages)} rows")
