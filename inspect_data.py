import geopandas as gpd
import pandas as pd

GPKG = 'processed_data/buildings_with_flood_risk.gpkg'

try:
    print(f"Loading {GPKG}...")
    # Read just the first few rows to inspect columns/schema
    gdf = gpd.read_file(GPKG, rows=5)
    print("\nColumns available:")
    for col in gdf.columns:
        print(f" - {col}")
    
    print("\nSample Data (First 3 rows):")
    print(gdf.drop(columns='geometry').head(3).to_string())

except Exception as e:
    print(f"Error: {e}")
