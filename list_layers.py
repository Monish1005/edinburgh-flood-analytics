import geopandas as gpd
import fiona

gdb_path = 'SEPA_River_Flood_Maps_v3_0/Data/FRM_River_Flood_Hazard_Layers_v3_0.gdb'
layers = fiona.listlayers(gdb_path)
print("Layers found:")
for l in layers:
    print(l)
