import geopandas as gpd
import pandas as pd
import numpy as np
import os
import json

# --- Configuration ---
BUILDINGS_GPKG = 'processed_data/buildings_with_flood_risk.gpkg'
SIMD_SHP = 'SG_SIMD_2020/SG_SIMD_2020.shp'
PROPERTY_PRICES_XLSX = 'Average price of residential units(￡).xlsx'
SEPA_GDB = 'SEPA_River_Flood_Maps_v3_0/Data/FRM_River_Flood_Hazard_Layers_v3_0.gdb'
OUTPUT_DIR = 'web_data'

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("🚀 Starting Web Data Preprocessing...")

# --- 1. Load Data ---
print(f"Loading Buildings from {BUILDINGS_GPKG}...")
buildings = gpd.read_file(BUILDINGS_GPKG)

# Reproject to WGS84 for Web immediately
print("Reprojecting buildings to EPSG:4326 (Lat/Lon)...")
buildings = buildings.to_crs('EPSG:4326')

print(f"Loading Property Prices from {PROPERTY_PRICES_XLSX}...")
prices = pd.read_excel(PROPERTY_PRICES_XLSX)
prices.columns = ['Postcode_Sector', 'Avg_Price', 'Coverage', 'Source']
prices['Postcode_Sector'] = prices['Postcode_Sector'].str.strip()

print(f"Loading Postcode Sectors...")
postcode_sectors = gpd.read_file('GB_Postcodes/PostalSector.shp').to_crs('EPSG:4326')

# --- 2. Data Enrichment ---

# 2.1 Spatial Join with Postcode Sectors to get Sector for Price Merge
print("Linking Buildings to Postcode Sectors...")
buildings_with_sector = gpd.sjoin(
    buildings,
    postcode_sectors[['geometry', 'GISSect']], 
    how='left',
    predicate='within'
)
buildings['postcode_sector'] = buildings_with_sector['GISSect']

# 2.2 Merge Property Prices
print("Merging Property Prices...")
buildings['postcode_sector'] = buildings['postcode_sector'].astype(str)
prices['Postcode_Sector'] = prices['Postcode_Sector'].astype(str)

buildings = buildings.merge(
    prices[['Postcode_Sector', 'Avg_Price']],
    left_on='postcode_sector',
    right_on='Postcode_Sector',
    how='left'
)
buildings['property_value'] = buildings['Avg_Price'].fillna(0) # Default to 0 if missing

# 2.3 Simulating/Ensuring Depth Data Exists (Logic adapted from export_to_oracle.py)
# Note: For this script, we assume the GPKG *might* already have gridcodes. 
# If not, we would need the heavy logic from export_to_oracle.py. 
# Let's inspect columns first in a real run, but here we'll be robust.

# 2.3 Calculate Flood Depths if missing
# We need to do this BEFORE reprojecting to 4326 if we want to be accurate/fast matching with British National Grid data
# But we already reprojected to 4326 at the top. Let's reload or reproject back.
# Actually, let's just do the check before reprojection next time. 
# For now, let's reproject back to 27700 for the join.

if 'gridcode_h' not in buildings.columns:
    print("⚠️ Gridcodes missing. Performing Spatial Join with SEPA Flood Maps...")
    
    # helper for max gridcode
    def get_max_valid_gridcode(join_df):
        if join_df.empty:
            return pd.Series(dtype=int)
        temp = join_df.copy()
        temp.loc[temp['GRIDCODE'] == 999, 'GRIDCODE'] = -1
        max_vals = temp.groupby(temp.index)['GRIDCODE'].max()
        return max_vals.replace(-1, 999)

    buildings_proj = buildings.to_crs('EPSG:27700')
    
    depth_layers = {
        'h': 'FRM_FH_RIVER_DEPTH_H',
        'm': 'FRM_FH_RIVER_DEPTH_M',
        'l': 'FRM_FH_RIVER_DEPTH_L'
    }
    
    for scenario, layer_name in depth_layers.items():
        print(f"  Processing {scenario.upper()} depth layer...")
        try:
            depth_data = gpd.read_file(SEPA_GDB, layer=layer_name, bbox=tuple(buildings_proj.total_bounds))
            if depth_data.crs != 'EPSG:27700':
                depth_data = depth_data.to_crs('EPSG:27700')
                
            depth_join = gpd.sjoin(
                buildings_proj, 
                depth_data[['GRIDCODE', 'geometry']],
                predicate='intersects', 
                how='left'
            )
            
            grid_col = f'gridcode_{scenario}'
            buildings[grid_col] = get_max_valid_gridcode(depth_join)
            buildings[grid_col] = buildings[grid_col].fillna(0).astype(int)
            print(f"    Found {(buildings[grid_col] > 0).sum()} buildings with flood depth.")
            
        except Exception as e:
            print(f"    ❌ Error processing layer {layer_name}: {e}")
            buildings[f'gridcode_{scenario}'] = 0
else:
    print("Found gridcodes in GPKG.")
    for scenario in ['h', 'm', 'l']:
        buildings[f'gridcode_{scenario}'] = buildings[f'gridcode_{scenario}'].fillna(0)

# --- 3. Calculate Damages ---
print("Calculating Damages...")
buildings['residential_units'] = buildings['buildinguse_addresscount_residential'].fillna(1) # Default to 1 unit

damage_scenarios = {
    'h': {'prob': 'High', 'desc': '10-yr'},
    'm': {'prob': 'Medium', 'desc': '200-yr'},
    'l': {'prob': 'Low', 'desc': '1000-yr'}
}

for key in damage_scenarios:
    grid_col = f'gridcode_{key}'
    damage_col = f'damage_{key}'
    
    # Simple Damage Function
    # 1 (Low) = 25%, 2 (Med) = 40%, 3 (High) = 75%
    conditions = [
        buildings[grid_col] == 1,
        buildings[grid_col] == 2,
        buildings[grid_col] == 3
    ]
    choices = [0.25, 0.40, 0.75]
    damage_pct = np.select(conditions, choices, default=0.0)
    
    buildings[damage_col] = buildings['property_value'] * damage_pct * buildings['residential_units']

# 2.4 Spatial Join with SIMD (Enrichment for Popup)
print("Linking Buildings to SIMD Zones...")
simd = gpd.read_file(SIMD_SHP).to_crs('EPSG:4326')

buildings_with_simd = gpd.sjoin(
    buildings,
    simd[['DataZone', 'Quintilev2', 'DZName', 'geometry']],
    how='left',
    predicate='within'
)
# Map columns back
buildings['quintile'] = buildings_with_simd['Quintilev2'].fillna(0).astype(int)
buildings['zone_name'] = buildings_with_simd['DZName'].fillna('Unknown')
buildings['datazone'] = buildings_with_simd['DataZone']

# 2.5 Classify Building Usage
print("Classifying Building Usage...")
# Fill NAs for counting (ensure we don't error on NaN)
buildings['res_count'] = buildings['buildinguse_addresscount_residential'].fillna(0)
buildings['comm_count'] = buildings['buildinguse_addresscount_commercial'].fillna(0)
buildings['other_count'] = buildings['buildinguse_addresscount_other'].fillna(0)

def classify_usage(row):
    if row['res_count'] > 0 and row['comm_count'] > 0:
        return 'Mixed'
    elif row['res_count'] > 0:
        return 'Residential'
    elif row['comm_count'] > 0:
        return 'Commercial'
    else:
        return 'Other'

buildings['use_class'] = buildings.apply(classify_usage, axis=1)
print(f"  - Calculated Usage Classes:\n{buildings['use_class'].value_counts()}")


# --- 4. Export for Web ---

print("Preparing GeoJSON export...")

# minimal columns for the map + enrichment
output_cols = [
    'osid', 
    'geometry', 
    'property_value',
    'residential_units',
    'damage_h', 'damage_m', 'damage_l',
    'gridcode_h', 'gridcode_m', 'gridcode_l',
    'description', # Ensure this exists in GPKG
    'quintile',
    'use_class',
    'buildinguse_addresscount_commercial', # ADD THIS!
    'zone_name',
    'postcode_sector'
]

# Ensure description columns exists (it usually does in OS data as 'description' or 'theme')
if 'description' not in buildings.columns:
    buildings['description'] = 'Residential Building'

# Simplify geometry to points if they are polygons (much faster for web)
# OS Buildings are polygons. Leaflet handles points better for 70k features.
# But polygons look nicer. Let's stick to Centroids for the main "Dot" layer, 
# or keep polygons if we use vector tiles. 
# For a simple React + Leaflet app, loading 78k polygons is HEAVY.
# converting to centroids for the visualization layer.
buildings_centroids = buildings.copy()
buildings_centroids['geometry'] = buildings_centroids.geometry.centroid

# Save to GeoJSON
output_file = os.path.join(OUTPUT_DIR, 'buildings.geojson')
buildings_centroids[output_cols].to_file(output_file, driver='GeoJSON')
print(f"✅ Saved Buildings GeoJSON to {output_file}")

# 4.3 Export Flood Extents
print("Exporting Flood Extent Polygons...")
# We assume these exist in processed_data from previous notebook runs. 
# If not, we would need to load from raw SEPA GDB.
# Based on file listing, they exist as:
# flood_extent_high.geojson, flood_extent_medium.geojson, flood_extent_low.geojson

extent_files = {
    'high': 'processed_data/flood_extent_high.geojson',
    'medium': 'processed_data/flood_extent_medium.geojson',
    'low': 'processed_data/flood_extent_low.geojson'
}

for risk, path in extent_files.items():
    if os.path.exists(path):
        # We can just copy them, or load/simplify if too large.
        # Let's verify size. If > 10MB maybe simplify. they are ~7MB.
        # Let's just copy for now to save processing time, simplistic.
        # But we need them in web_data/
        import shutil
        dest = os.path.join(OUTPUT_DIR, f'extent_{risk}.geojson')
        shutil.copy(path, dest)
        print(f"  - Copied {risk} extent to {dest}")
    else:
        print(f"  ⚠️ Missing extent file: {path}")

# 4.4 Aggregate by SIMD Zone (for Choropleth Layer)
print("Aggregating by SIMD Zone...")
# We utilize the spatial join we did earlier (buildings_with_simd)
# We want: Zone Geometry + Aggregated Damage + Risk Counts

# Pre-calculate units at risk per scenario
buildings['units_risk_h'] = buildings.apply(lambda r: r['residential_units'] if r['gridcode_h'] > 0 else 0, axis=1)
buildings['units_risk_m'] = buildings.apply(lambda r: r['residential_units'] if r['gridcode_m'] > 0 else 0, axis=1)
buildings['units_risk_l'] = buildings.apply(lambda r: r['residential_units'] if r['gridcode_l'] > 0 else 0, axis=1)

# Group buildings by DataZone
zone_stats = buildings.groupby('datazone').agg({
    'residential_units': 'sum', # Total units (stats context)
    'units_risk_h': 'sum',
    'units_risk_m': 'sum',
    'units_risk_l': 'sum',
    'damage_h': 'sum',
    'damage_m': 'sum',
    'damage_l': 'sum',
    'property_value': 'mean'
}).reset_index()

zone_stats.columns = [
    'DataZone', 
    'total_units', 
    'units_risk_h', 'units_risk_m', 'units_risk_l',
    'zone_damage_h', 'zone_damage_m', 'zone_damage_l', 
    'avg_property_val'
]

# Merge with SIMD geometry
simd_zones = simd[['DataZone', 'DZName', 'Quintilev2', 'geometry']].merge(
    zone_stats, on='DataZone', how='inner' # Only keep zones with risk
)

# Save
simd_output = os.path.join(OUTPUT_DIR, 'simd_zones.geojson')
simd_zones.to_file(simd_output, driver='GeoJSON')
print(f"✅ Saved SIMD Zones GeoJSON to {simd_output}")


# 4.2 Generate Aggregate Stats
print("Generating Aggregate Statistics...")
stats = {}

for key in damage_scenarios:
    total_damage = buildings[f'damage_{key}'].sum()
    affected_count = (buildings[f'damage_{key}'] > 0).sum()
    stats[key] = {
        'total_damage': total_damage,
        'affected_buildings': int(affected_count),
        'scenario_name': damage_scenarios[key]['desc']
    }

stats_file = os.path.join(OUTPUT_DIR, 'stats.json')
with open(stats_file, 'w') as f:
    json.dump(stats, f, indent=2)
print(f"✅ Saved Statistics to {stats_file}")

print("🎉 Preprocessing Complete!")
