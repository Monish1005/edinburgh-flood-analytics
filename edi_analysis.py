import geopandas as gpd
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import MinMaxScaler

# Set style
sns.set_theme(style="whitegrid")

print("🚀 Starting Environmental Deprivation Index (EDI) Analysis...")

# --- 1. Load Data ---
print("Loading datasets...")
# Postcode Sectors (for Area calculation)
sectors = gpd.read_file('GB_Postcodes/PostalSector.shp')
if sectors.crs != 'EPSG:27700':
    sectors = sectors.to_crs('EPSG:27700')

# --- 2. Calculate Sector Metrics ---
print("Calculating Sector Metrics...")

# Calculate Area in Hectares
sectors['Area_Ha'] = sectors.geometry.area / 10000

# Load the CSVs we just made! They are clean.
print("  Loading Oracle Export CSVs...")
df_buildings = pd.read_csv('oracle_exports/buildings_static.csv')
df_damages = pd.read_csv('oracle_exports/flood_damages.csv')

# Filter for Medium Scenario
df_damages_med = df_damages[df_damages['SCENARIO_ID'] == 'MEDIUM']

# Merge
df = df_buildings.merge(df_damages_med, on='OSID', how='left')
df['DAMAGE_ESTIMATE'] = df['DAMAGE_ESTIMATE'].fillna(0)

# Aggregate by Postcode Sector
sector_stats = df.groupby('POSTCODE_SECTOR').agg({
    'OSID': 'count',              # Total Buildings
    'DAMAGE_ESTIMATE': 'sum',     # Total Damage
    'PROPERTY_VALUE': 'mean'      # Average Wealth
}).reset_index()

# Merge with Geometry
edi_df = sectors.merge(sector_stats, left_on='GISSect', right_on='POSTCODE_SECTOR', how='inner')

# --- 3. Calculate Scores ---
print("Calculating Scores...")

# A. Risk Score: Damage per Hectare
edi_df['Risk_Raw'] = edi_df['DAMAGE_ESTIMATE'] / edi_df['Area_Ha']

# B. Crowding Score: Buildings per Hectare (Proxy for lack of greenspace)
edi_df['Crowding_Raw'] = edi_df['OSID'] / edi_df['Area_Ha']

# C. Deprivation Score: Inverse of Property Value (Proxy for SIMD)
# Higher Value = Lower Score. Lower Value = Higher Score.
edi_df['Deprivation_Raw'] = 1 / edi_df['PROPERTY_VALUE']

# Normalize (0-10)
scaler = MinMaxScaler(feature_range=(0, 10))
edi_df[['Risk_Score', 'Crowding_Score', 'Deprivation_Score']] = scaler.fit_transform(
    edi_df[['Risk_Raw', 'Crowding_Raw', 'Deprivation_Raw']].fillna(0)
)

# Final EDI
edi_df['EDI_Score'] = edi_df['Risk_Score'] + edi_df['Crowding_Score'] + edi_df['Deprivation_Score']

# --- 4. Visualization ---
print("Generating Visualization...")

plt.figure(figsize=(12, 8))
scatter = sns.scatterplot(
    data=edi_df, 
    x='PROPERTY_VALUE', 
    y='EDI_Score', 
    size='DAMAGE_ESTIMATE', 
    hue='Risk_Score', 
    palette='viridis', 
    sizes=(50, 1000),
    alpha=0.7
)

plt.title('Environmental Deprivation Index (EDI) vs. Wealth', fontsize=16)
plt.xlabel('Average Property Value (£) (Wealth Proxy)', fontsize=12)
plt.ylabel('EDI Score (Higher = More Deprived)', fontsize=12)
plt.axvline(x=edi_df['PROPERTY_VALUE'].median(), color='red', linestyle='--', label='Median Wealth')
plt.axhline(y=edi_df['EDI_Score'].median(), color='blue', linestyle='--', label='Median EDI')

# Annotate top 3 worst sectors
top_3 = edi_df.sort_values('EDI_Score', ascending=False).head(3)
for line in range(0, 3):
    row = top_3.iloc[line]
    plt.text(row['PROPERTY_VALUE'], row['EDI_Score'], row['GISSect'], horizontalalignment='left', size='medium', color='black', weight='semibold')

plt.legend(bbox_to_anchor=(1.05, 1), loc=2, borderaxespad=0.)
plt.tight_layout()

output_img = 'edi_scatter_plot.png'
plt.savefig(output_img, dpi=300)
print(f"✅ Visualization saved to {output_img}")

# Save Data
edi_df[['GISSect', 'EDI_Score', 'Risk_Score', 'Crowding_Score', 'Deprivation_Score']].to_csv('edi_scores.csv', index=False)
print("✅ EDI Scores saved to edi_scores.csv")
