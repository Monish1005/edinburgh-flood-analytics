import geopandas as gpd
import os

GDB_PATH = 'SEPA_River_Flood_Maps_v3_0/Data/FRM_River_Flood_Hazard_Layers_v3_0.gdb'
OUTPUT_DIR = 'web_data'
BUILDINGS_FILE = 'web_data/buildings.geojson'

# Map internal layer names to output filenames
LAYERS = {
    'FRM_FH_RIVER_EXTENT_H': 'extent_high.geojson',
    'FRM_FH_RIVER_EXTENT_M': 'extent_medium.geojson',
    'FRM_FH_RIVER_EXTENT_L': 'extent_low.geojson'
}

print(f"🚀 Exporting extent layers from {GDB_PATH}...")

# 1. Get Bounding Box from Buildings (to clip data)
print(f"  - Loading {BUILDINGS_FILE} to determine area of interest...")
buildings = gpd.read_file(BUILDINGS_FILE)

# Reproject to 27700 (British National Grid) to match SEPA GDB
buildings_bng = buildings.to_crs('EPSG:27700')
bbox = tuple(buildings_bng.total_bounds)
print(f"  - BBox (BNG): {bbox}")

# Buffer bbox by 500m to ensure coverage
bbox_buffered = (bbox[0]-500, bbox[1]-500, bbox[2]+500, bbox[3]+500)

for layer_name, filename in LAYERS.items():
    print(f"  - Processing {layer_name}...")
    try:
        # Read layer with Spatial Filter (BBOX) to strict size
        gdf = gpd.read_file(GDB_PATH, layer=layer_name, bbox=bbox_buffered)
        
        if gdf.empty:
            print(f"    ⚠️ No features found in bbox for {layer_name}")
            continue

        # Reproject to WGS84 (Leaflet default)
        if gdf.crs != 'EPSG:4326':
            # print("    Reprojecting to EPSG:4326...")
            gdf = gdf.to_crs('EPSG:4326')
            
        # Simplify! Critical for web.
        # 0.0001 degrees is roughly 10 meters. 
        # For a city-wide map, 10m fidelity is acceptable for "Extents".
        print("    Simplifying geometry (tol=0.00005)...")
        gdf['geometry'] = gdf.simplify(0.00005)

        # Save
        out_path = os.path.join(OUTPUT_DIR, filename)
        gdf.to_file(out_path, driver='GeoJSON')
        print(f"    ✅ Saved to {out_path} ({len(gdf)} features)")
        
    except Exception as e:
        print(f"    ❌ Error: {e}")

print("🎉 Export Complete!")
