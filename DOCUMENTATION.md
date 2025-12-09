# 🌊 Flood Damage Analysis - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Datasets](#datasets)
3. [Methodology](#methodology)
4. [Installation & Setup](#installation--setup)
5. [How to Use](#how-to-use)
6. [Analysis Workflow](#analysis-workflow)
7. [Key Outputs](#key-outputs)
8. [Technical Details](#technical-details)

---

## Overview

This Jupyter notebook performs a comprehensive spatial analysis of residential flood damage in Edinburgh, Scotland. It integrates multiple datasets to:

- **Identify** which buildings are at risk from river flooding
- **Quantify** the number of residential units exposed
- **Estimate** economic damage for three flood probability scenarios
- **Analyze** the relationship between flood risk and socioeconomic deprivation
- **Visualize** results through interactive maps and charts

### Purpose
This analysis provides evidence for the economic value of flood mitigation measures (such as green infrastructure) by quantifying the potential damage that could be prevented.

### Study Area
City of Edinburgh, Scotland (focused on areas within SEPA flood risk zones)

---

## Datasets

### 1. SEPA River Flood Maps
**Source**: Scottish Environment Protection Agency  
**Website**: https://www2.sepa.org.uk/flooddata/

**What it contains**:
- Flood extent polygons (areas that could be flooded)
- Flood depth rasters (how deep the water would be)
- Three probability scenarios:
  - **High (H)**: 1 in 10 year event - Most frequent, lower severity
  - **Medium (M)**: 1 in 200 year event - Moderate frequency/severity
  - **Low (L)**: 1 in 1000 year event - Rare, highest severity

**Why we use it**: This is the authoritative source for flood risk data in Scotland, based on hydraulic modeling.

**Data format**: File Geodatabase (.gdb)

**Key fields**:
- `GRIDCODE`: Depth category (1 = <0.3m, 2 = 0.3-1.0m, 3 = >1.0m)
- `PROB`: Probability scenario (H/M/L)

### 2. Ordnance Survey Buildings
**Source**: Ordnance Survey  
**What it contains**:
- Building footprint polygons
- Building characteristics (age, height, material, use)
- **Residential unit counts** (`buildinguse_addresscount_residential`)
- Building descriptions

**Why we use it**: Provides detailed building-level data to identify which structures are at risk and how many residential units they contain.

**Data format**: GeoPackage (.gpkg)

### 3. Scottish Index of Multiple Deprivation (SIMD)
**Source**: Scottish Government  
**What it contains**:
- Data zone boundaries (small geographic areas)
- Deprivation rankings and quintiles
- Multiple deprivation indicators

**Why we use it**: Allows analysis of whether flood risk disproportionately affects deprived communities.

**Key fields**:
- `DataZone`: Unique zone identifier
- `SIMD2020_Quintile` or `Quintilev2`: Deprivation quintile (1=most deprived, 5=least deprived)

**Data format**: Shapefile (.shp)

### 4. Property Values
**Source**: Property price data by postcode sector  
**What it contains**: Average property values (£/unit) for each postcode sector

**Why we use it**: Essential for converting flood depth into economic damage estimates.

**Data format**: Excel spreadsheet

---

## Methodology

### Spatial Analysis Approach

#### 1. **Spatial Overlay**
Buildings are spatially joined with SEPA flood extent polygons to identify which buildings are at risk:

```python
buildings_flood = gpd.sjoin(buildings, flood_extent, predicate='intersects')
```

#### 2. **Depth Assignment**
For each at-risk building, flood depth is determined by:
- Extracting the building centroid
- Spatially joining with SEPA depth rasters
- Assigning the GRIDCODE (depth category) to each building

#### 3. **Damage Calculation**
Damage is calculated using **EU flood depth-damage curves**:

**Depth-Damage Function**:
- `GRIDCODE 1` (<0.3m): 10% property value
- `GRIDCODE 2` (0.3-1.0m): 30% property value  
- `GRIDCODE 3` (>1.0m): 45% property value

**Per-Building Damage Formula**:
```
Building Damage = (Damage %) × (Property Value) × (Number of Residential Units)
```

**Example**:
- Building with 10 units
- Property value: £250,000/unit
- Flood depth: 0.5m (GRIDCODE 2 = 30% damage)
- **Total damage**: 0.30 × £250,000 × 10 = **£750,000**

#### 4. **Scenario-Specific Calculations**
Each scenario (High, Medium, Low) has:
- Different flood extents (more area flooded in Low scenario)
- Different depths at the same location
- **Independent damage calculations** - buildings may only be flooded in some scenarios

### Key Methodological Decisions

**Why use centroids for depth assignment?**
- Avoids duplicate matches (one building intersecting multiple depth polygons)
- Provides clean 1:1 mapping between buildings and depths
- Centroid represents average building location

**Why calculate damage per unit?**
- A single building may contain multiple residential units (flats, apartments)
- Total building damage = per-unit damage × number of units
- More accurate than treating all buildings equally

**Why scenario-specific unit counts?**
- Different scenarios flood different numbers of buildings
- When calculating "damage per affected unit", we only count units actually flooded in that scenario
- Provides accurate intensity metrics

---

## Installation & Setup

### Requirements

**Python Packages**:
```bash
pip install geopandas pandas numpy matplotlib seaborn folium ipywidgets openpyxl
```

**System Requirements**:
- Python 3.8+
- Jupyter Notebook or JupyterLab


### Data Preparation

1. **Download SEPA Flood Maps**:
   - Visit https://www2.sepa.org.uk/flooddata/
   - Download River Flood Hazard Layers (File Geodatabase)
   - Extract to: `SEPA_River_Flood_Maps_v3_0/`

2. **Obtain OS Buildings Data**:
   - Download for Edinburgh area
   - Save as: `OS_Buildings_Edinburgh.gpkg`

3. **Download SIMD Data**:
   - Scottish Government website
   - Save shapefile to working directory

4. **Property Values**:
   - Create Excel file with postcode sectors and average property values
   - Save as: `property_values.xlsx`

### Directory Structure
```
flood/
├── flood_damage_analysis.ipynb
├── SEPA_River_Flood_Maps_v3_0/
│   └── Data/
│       └── FRM_River_Flood_Hazard_Layers_v3_0.gdb
├── OS_Buildings_Edinburgh.gpkg
├── simd_shapefile.shp
└── property_values.xlsx
```

---

## How to Use

### Step-by-Step Guide

1. **Open the Notebook**:
   ```bash
   jupyter notebook flood_damage_analysis.ipynb
   ```

2. **Run Cells Sequentially**:
   - Start from the top and run each cell in order
   - The notebook is designed to run linearly
   - Each section builds on previous results

3. **Key Decision Points**:

   **Cell 1-5: Imports and Setup**
   - No modifications needed
   - Installs/imports required packages

   **Cell 6-10: Load Flood Data**
   - Adjust `EDINBURGH_BBOX` if analyzing different area
   - Modify `GDB_PATH` if your file location differs

   **Cell 11-15: Load Buildings**
   - Update `buildings` file path if needed
   - Filter by building types if desired

   **Cell 20+: Spatial Joins**
   - These cells perform the core analysis
   - **Do not modify** unless you understand spatial operations

   **Cell 39: Interactive Visualization**
   - Select flood scenario from dropdown
   - Visualization updates automatically
   - Explore different scenarios interactively

   **Cell 46: SIMD Analysis**
   - Analyzes deprivation patterns
   - Creates 2×2 visualization automatically

   **Cell 48: Interactive Map**
   - Creates HTML map file
   - Open `flood_damage_map.html` in browser
   - Toggle layers on/off

4. **Modify for Your Analysis**:
   - Change study area by updating bounding box
   - Adjust damage curves if using different percentages
   - Filter to specific building types or areas of interest

---

## Analysis Workflow

### Phase 1: Data Loading (Cells 1-15)
```
Load SEPA flood data → Load OS Buildings → Load SIMD zones → Load property values
```

### Phase 2: Spatial Analysis (Cells 16-30)
```
Identify flooded buildings → Assign flood depths → Join SIMD data → Link property values
```

### Phase 3: Damage Calculation (Cells 31-38)
```
Apply depth-damage curves → Calculate per-building damage → Aggregate by sector/zone
```

### Phase 4: Visualization & Analysis (Cells 39-50)
```
Interactive scenario selector → Top sectors analysis → Deprivation analysis → Interactive map
```

---

## Key Outputs

### 1. Summary Statistics

**Based on actual analysis results**:

**Buildings and Units**:
- **Buildings with flood risk** (any scenario): ~3,000+ buildings
- **Residential units in study area**: 175,251 total units
- **Units affected by scenario**:
  - High (1 in 10 yr): 988 units
  - Medium (1 in 200 yr): 2,722 units
  - Low (1 in 1000 yr): 8,132 units

**Damage Estimates**:
- **High Scenario (1 in 10 yr)**:
  - Buildings with damage: 119
  - Total damage: **£204,990,558** (~£205 million)
  - Average per building: £1,722,610
  - Average per unit: £207,480

- **Medium Scenario (1 in 200 yr)**:
  - Buildings with damage: 728
  - Total damage: **£388,762,993** (~£389 million)
  - Average per building: £534,015
  - Average per unit: £142,823

- **Low Scenario (1 in 1000 yr)**:
  - Buildings with damage: 1,000+ buildings
  - Total damage: **£1,118,300,950** (~£1.1 billion)
  - Significantly higher impact in catastrophic flood event

**Top Vulnerable Sectors** (by units at risk in Low scenario):
1. **EH11 3**: 1,546 units
2. **EH 7 4**: 979 units  
3. **EH 6 6**: 916 units
4. **EH 3 5**: 863 units
5. **EH12 5**: 751 units

**Deprivation Analysis**:
- **Quintile 1 (Most Deprived)**: 
  - 170 buildings, 409 units at risk
  - Damage range: £6M - £28M across scenarios
  
- **Quintile 2 (Highly Deprived)**:
  - 2,174 units at risk
  - Second-highest exposure

### 2. Interactive Visualizations

**Scenario Selector** (Cell 39):
- Dropdown to select High/Medium/Low scenario
- Dynamic 2×2 plots showing:
  - Top 10 sectors by damage
  - Top 10 sectors by units at risk
  - Scenario comparison for top sector
  - Damage distribution histogram

**SIMD Analysis** (Cell 46):
- Buildings/units at risk by deprivation quintile
- Total damage by quintile and scenario
- Average damage per affected unit
- Color-coded by deprivation level

**Interactive Map** (Cell 48):
- SIMD zones colored by damage intensity
- Individual buildings (toggle on/off)
- Click for detailed popup information
- Export as standalone HTML file

### 3. Data Outputs

**Main DataFrames**:
- `buildings_risk`: All buildings with flood risk flags and depths
- `at_risk_residential`: Filtered to residential buildings only
- `with_damage`: Buildings with damage estimates

**Export Options**:
```python
# Save to GeoPackage
buildings_risk.to_file("flood_risk_results.gpkg", driver="GPKG")

# Save to CSV (without geometry)
buildings_risk.drop(columns='geometry').to_csv("flood_risk.csv")
```

---

## Technical Details

### Coordinate Reference Systems
- **SEPA data**: EPSG:27700 (British National Grid)
- **All analysis**: Converted to EPSG:4326 (WGS84 lat/lon) for mapping

### Performance Considerations
- **Large datasets**: ~78,000 buildings, ~30,000 flood depth polygons
- **Spatial joins**: Most computationally expensive operations
- **Map rendering**: Limited to all buildings (no sampling needed, ~3,400 at risk)

### Data Quality Notes

**Missing Property Values**:
- Some postcode sectors may lack property value data
- Buildings in these sectors will have `NaN` damage values
- Check `property_value` column for missing data

**GRIDCODE = 0 or 999**:
- `0`: No flood depth data (building on edge of flood extent)
- `999`: Data not available
- These buildings are flagged as at risk but have uncertain depth

**SIMD Matching**:
- Uses building centroids to assign SIMD zones
- Some buildings may not match if centroid falls outside SIMD boundary
- Check `DataZone` column for `NaN` values

### Validation Checks

Run these to verify data quality:

```python
# Check for buildings at risk but missing damage data
at_risk_no_damage = buildings_risk[
    (buildings_risk['any_flood_risk']) & 
    (buildings_risk['damage_max'].isna())
]
print(f"Buildings at risk with no damage data: {len(at_risk_no_damage)}")

# Check SIMD matching rate
simd_matched = buildings_risk['DataZone'].notna().sum()
total = len(buildings_risk)
print(f"SIMD match rate: {simd_matched/total*100:.1f}%")

# Verify scenario-specific counts
print(f"High scenario: {buildings_risk['flood_risk_h'].sum()} buildings")
print(f"Medium scenario: {buildings_risk['flood_risk_m'].sum()} buildings")
print(f"Low scenario: {buildings_risk['flood_risk_l'].sum()} buildings")
```

---

## Limitations and Uncertainties

### Data Quality Issues

#### 1. **Missing Flood Depth Data**
**Issue**: Not all buildings within flood extents have associated depth data.

**Specifics**:
- **GRIDCODE = 0**: Buildings flagged as flooded but depth data unavailable
- **GRIDCODE = 999**: "Data not available" flag from SEPA
- **Impact**: These buildings are identified as "at risk" but **cannot have damage calculated**

**Quantification**:
```python
# Check buildings at risk with missing depth
buildings_missing_depth = buildings_risk[
    (buildings_risk['any_flood_risk']) & 
    ((buildings_risk['gridcode_h'] == 0) | 
     (buildings_risk['gridcode_h'] == 999) |
     (buildings_risk['gridcode_h'].isna()))
]
print(f"Buildings with missing depth data: {len(buildings_missing_depth)}")
```

**Why this occurs**:
- Buildings on edges of flood extent polygons
- Gaps in SEPA depth raster coverage
- Buildings whose centroids fall outside flood depth zones

**Consequence**: **Damage estimates are likely understated** - we're missing some flooded buildings.

#### 2. **Missing or Incorrect Residential Unit Counts**
**Issue**: OS Buildings data may have missing or inaccurate residential unit counts.

**Specifics**:
- Some buildings show `residential_units = 0` despite being residential
- New buildings may not have updated unit counts
- Conversions (commercial → residential) may not be reflected

**Impact on Results**:
- **Underestimation of units at risk** if counts are missing
- **Damage calculations incorrect** if multiplying by wrong unit count
- Per-unit damage metrics affected

**Mitigation**: We only analyze buildings with `residential_units > 0`, but this may exclude some actual residential buildings.

#### 3. **Missing Property Value Data**
**Issue**: Not all postcode sectors have property value data.

**Impact**:
- Buildings in sectors without property values have `NaN` damage
- These buildings are counted as "at risk" but **excluded from damage totals**
- **Results underestimate total damage** by excluding these areas

**Check**:
```python
# Buildings at risk but no property value
no_price_data = buildings_risk[
    (buildings_risk['any_flood_risk']) & 
    (buildings_risk['property_value'].isna())
]
print(f"Buildings without property values: {len(no_price_data)}")
```

### Scope Limitations

#### 1. **Residential Buildings Only**
**Decision**: Analysis focuses exclusively on residential properties.

**Why**:
- **Commercial property valuation is complex**: 
  - Wide variation in property types (offices, retail, industrial, warehouses)
  - Different damage curves for different commercial uses
  - Property values not readily available by sector
  - Business interruption costs difficult to estimate
  
**What's excluded**:
- Commercial buildings
- Industrial facilities  
- Public buildings (schools, hospitals)
- Infrastructure

**Impact**: **Total flood damage is significantly understated** - commercial damage could be substantial but is not quantified.

#### 2. **River Flooding Only**
**Scope**: Analysis uses SEPA River Flood Maps only.

**Not included**:
- Surface water flooding
- Coastal flooding
- Groundwater flooding
- Sewer flooding

**Impact**: Buildings at risk from other flood sources are **not captured**.

#### 3. **Direct Damage Only**
**What we calculate**: Physical damage to buildings

**Not included**:
- **Indirect economic costs**:
  - Business interruption
  - Lost productivity
  - Supply chain disruption
- **Social costs**:
  - Displacement and temporary accommodation
  - Health impacts
  - Psychological trauma
- **Infrastructure damage**:
  - Roads, bridges, utilities

**Impact**: **True economic cost of flooding is much higher** than our estimates suggest.

### Methodological Assumptions and Limitations

#### 1. **Depth-Damage Curves**
**Assumption**: EU standard depth-damage curves apply to Edinburgh properties.

**Issues**:
- Curves are generalized for European residential buildings
- May not reflect Edinburgh-specific:
  - Building construction types
  - Building ages (many historic buildings)
  - Flood resistance measures
  - Quality of properties

**Alternative**: Could use UK-specific Multi-Coloured Manual (MCM) curves, but these require more detailed building data.

#### 2. **Property Values by Postcode Sector**
**Assumption**: Average property values apply uniformly within each postcode sector.

**Reality**:
- Significant variation within sectors
- Property values vary by:
  - Specific location
  - Property size and quality
  - View, amenities, condition

**Impact**: May **over-estimate** damage in lower-value parts of sector, **under-estimate** in higher-value parts.

#### 3. **Static Analysis (No Climate Change)**
**Limitation**: Uses current flood maps, doesn't account for:
- Climate change impacts
- Sea level rise
- Changes in rainfall patterns
- Urban development changes

**Future flood risk may be higher** than current estimates.

#### 4. **Centroid-Based Depth Assignment**
**Method**: Building centroids used to assign flood depth.

**Issue**:
- Large buildings may have varying depths across footprint
- Centroid may not be representative of worst-case depth
- Could **under-estimate** damage for large buildings

**Alternative**: Could use maximum depth within building footprint, but computationally expensive.

#### 5. **Per-Unit Damage Multiplication**
**Assumption**: Total building damage = per-unit damage × number of units

**Issues**:
- Assumes all units are equal in value
- Doesn't account for:
  - Ground floor vs upper floors (different exposure)
  - Shared infrastructure costs
  - Economies of scale in repairs

**May over-estimate** damage for multi-unit buildings.

### Data Currency and Temporal Issues

#### 1. **Data Vintage**
- **SEPA Flood Maps**: Version 3.0 (published date: check in data)
- **OS Buildings**: Latest version as of download date
- **SIMD**: 2020 version (may not reflect current deprivation)
- **Property values**: Date-specific, may be outdated

**Risk**: Analysis may not reflect current conditions if data is several years old.

#### 2. **No Validation Against Historical Floods**
**Limitation**: Results not validated against actual historical flood events in Edinburgh.

**Why this matters**: 
- Model predictions vs reality may differ
- Damage estimates unverified
- Depth-damage curves not calibrated to local conditions

### Uncertainty Quantification

#### Overall Uncertainty Assessment

**Sources of Uncertainty** (ranked by impact):

1. **Missing depth data** → Moderate underestimation of damage
2. **Property value assumptions** → ±20-30% uncertainty
3. **Depth-damage curves** → ±30-40% uncertainty  
4. **Missing commercial buildings** → Significant underestimation of total economic impact
5. **Residential unit counts** → Minor impact on totals

**Combined Uncertainty**: 

Given cumulative uncertainties, actual damage could reasonably be:
- **Lower bound**: 70% of estimated values (if assumptions overestimate)
- **Upper bound**: 150% of estimated values (if we're underestimating)

**Example for Medium Scenario**:
- **Estimated**: £389 million
- **Plausible range**: £270 million - £580 million

### Recommendations for Future Improvements

1. **Address data gaps**:
   - Obtain property values for all sectors
   - Validate residential unit counts through alternative sources
   - Fill depth data gaps through interpolation or additional modeling

2. **Expand scope**:
   - Include commercial buildings (phased approach)
   - Consider surface water flooding
   - Add indirect costs estimation

3. **Refine methodology**:
   - Use UK-specific (MCM) depth-damage curves
   - Incorporate floor-level analysis
   - Account for flood resistance measures

4. **Validate results**:
   - Compare against historical flood events (e.g., Water of Leith floods)
   - Sensitivity analysis on key parameters
   - Expert review of damage estimates

5. **Update regularly**:
   - Re-run analysis with updated flood maps
   - Incorporate new property value data
   - Update for new developments

### Impact on Results Interpretation

**Key Takeaway**: Results should be interpreted as **order-of-magnitude estimates** rather than precise predictions.

**Appropriate uses**:
- ✅ Comparing relative risk between areas
- ✅ Identifying priority sectors for intervention
- ✅ Demonstrating economic case for flood mitigation
- ✅ Understanding spatial patterns of vulnerability

**Inappropriate uses**:
- ❌ Precise insurance claims estimation
- ❌ Property-level damage predictions
- ❌ Total economic impact of flooding (too many exclusions)

---

## Troubleshooting

### Common Issues

**ImportError: No module named 'geopandas'**
```bash
pip install geopandas
```

**FileNotFoundError: GDB file not found**
- Check `GDB_PATH` variable
- Ensure file has been extracted from zip
- Verify path is absolute or relative to notebook location

**ValueError: cannot reindex on an axis with duplicate labels**
- This occurs during spatial joins with polygon overlaps
- Solution: Use centroids instead of full geometries
- Already implemented in the notebook

**Map not displaying**
- Ensure `ipywidgets` is installed: `pip install ipywidgets`
- In Jupyter Lab: `jupyter labextension install @jupyter-widgets/jupyterlab-manager`
- Restart kernel after installation

**Memory issues**
- Reduce study area (adjust bounding box)
- Process in batches
- Close other applications

---

## References

### Data Sources
1. **SEPA Flood Maps**: https://www2.sepa.org.uk/flooddata/
2. **OS Buildings**: https://www.ordnancesurvey.co.uk/
3. **SIMD**: https://www.gov.scot/collections/scottish-index-of-multiple-deprivation-2020/

### Methodology References
1. **EU Flood Depth-Damage Curves**: 
   - Publication: "A pan-European database of flood damage functions"
   - https://op.europa.eu/en/publication-detail/-/publication/a20ecfa5-200e-11e7-84e2-01aa75ed71a1

2. **Flood Risk Assessment Methodology**:
   - Standard spatial overlay techniques for exposure assessment
   - Depth-damage functions for economic impact estimation

---

## Contact & Support

For questions or issues with this analysis:
1. Check this documentation
2. Review cell comments in the notebook
3. Verify data files are correctly located
4. Check Python package versions

**Recommended Citation**:
```
[Your Name] (2024). Flood Damage Assessment for Edinburgh: 
A Spatial Analysis of Residential Property Risk. 
Spatial Modelling and Analysis Project.
```

---

## Development Tools and AI Assistance

### AI Tools Used in Development

In the spirit of academic integrity and transparency, this section documents the AI tools used in developing this analysis.

#### 1. **GitHub Copilot**
**Purpose**: Code refactoring and optimization

**Specific uses**:
- Refactoring repetitive code blocks into functions
- Optimizing spatial join operations
- Suggesting pythonic code improvements
- Auto-completing common GIS operations

**Example**:
```python
# Copilot helped refactor repeated spatial join patterns into reusable code
buildings_with_simd = gpd.sjoin(buildings_centroids, simd, how='left', predicate='within')
```

#### 2. **Claude Sonnet (Anthropic)**
**Purpose**: Visualization design and enhancement

**Specific uses**:
- Designing better data visualizations
- Creating interactive widgets with ipywidgets
- Improving plot aesthetics and readability
- Suggesting appropriate chart types for different data

**Example contributions**:
- Interactive scenario selector with dropdown widgets
- Color schemes for deprivation quintiles (red → green gradient)
- 2×2 grid layouts for comparative visualizations
- Heatmap design for sector analysis

#### 3. **Antigravity (Google DeepMind)**
**Purpose**: Primary coding assistant and problem-solving

**Specific uses**:
- spatial analysis implementation
- Debugging complex GeoPandas operations
- Creating interactive folium maps using pre processed data
- Resolving data quality issues (e.g., duplicate indices, missing values)
- Writing comprehensive documentation
- Implementing scenario-specific unit count calculations
- Fixing indentation errors and code structure

**Example contributions**:
- Fixing scenario-specific damage per unit calculations
- Solving centroid vs polygon spatial join issues
- Implementing proper handling of missing depth data
- Creating SIMD deprivation analysis visualizations
- Writing this documentation

### Transparency Statement

**What the Human Did**:
- **Core analytical work**: All fundamental analysis was human-led:
  - Research question formulation and study design
  - **Dataset acquisition**: Downloading, extracting, and organizing all datasets (SEPA, OS Buildings, SIMD, property values)
  - **Data loading and validation**: Writing code to load GeoPackages, shapefiles, GDB files, and Excel data
  - **Data preprocessing**: Cleaning, filtering, and preparing spatial datasets for analysis
  - **Logic development**: Core counting logic for residential units, damage calculations, scenario-specific metrics
  - **Initial visualizations**: Creating baseline plots and charts to explore the data
  - Methodological approach (depth-damage curves selection and application)
  - Analysis scope decisions (residential only, three scenarios)
  
- **Critical thinking and validation**: 
  - Identifying limitations and uncertainties
  - **Catching AI errors**: Spotting incorrect unit count calculations, missing scenario-specific logic
  - Validating results against expected patterns
  - Testing code outputs at each step
  - Interpreting findings in geographical and policy context
  
- **Spatial analysis design**: 
  - Determining which spatial operations to use (overlay, join, centroid extraction)
  - Specifying how to handle missing data and edge cases
  - Deciding on coordinate systems and transformations

- **Technical implementation (shared with AI)**:
  - Writing significant portions of data loading code
  - Implementing validation checks
  - Creating initial visualizations
  - Processing property value data by postcode sector
  - Debugging and testing throughout development

**What AI Did**:
- **Code assistance**: AI tools assisted with coding, particularly:
  - Help with spatial join operations syntax
  - Visualization of preprocessed data (formatting, styling)
  - Data validation check implementation
  - Interactive map creation using preprocessed data
  - Refactoring code for efficiency
  
- **Problem solving**: AI helped debug and fix:
  - Indentation errors and syntax issues
  - Duplicate index issues in spatial joins
  - Scenario-specific unit count logic (after human identified the problem)
  - Missing data handling edge cases

- **Enhancement and polish**:
  - Improving visualization aesthetics
  - Adding interactive widgets (ipywidgets for scenario selector)
  - Creating comprehensive documentation
  - Suggesting code optimizations

**Division of Labor** (Approximate):
- **Conceptual/Analytical Work**: 100% Human
- **Data Acquisition & Preprocessing**: 90% Human, 10% AI (syntax help)
- **Core Logic Implementation**: 70% Human, 30% AI (debugging, optimization)
- **Visualization & Interactivity**: 50% Human (initial plots, design specs), 50% AI (enhancement, widgets)
- **Documentation**: 40% Human (structure, content direction), 60% AI (writing, formatting)
- **Debugging & Refinement**: 60% Human (identifying issues), 40% AI (implementing fixes)

### Academic Integrity Note

This analysis represents a **human-AI collaboration**:

- **Core intellectual work** (research design, data interpretation, critical analysis) was performed by the human author
- **Technical implementation** (coding, visualization, debugging) was assisted by AI tools
- **All code is transparent** and available for review in the Jupyter notebook
- **Methods are documented** allowing reproduction and validation


**Best practices followed**:
1. ✅ **Transparency**: Clearly documenting AI usage
2. ✅ **Understanding**: Human can explain all code and methodology
3. ✅ **Validation**: Results checked against expected patterns
4. ✅ **Critical review**: Human identified and corrected AI errors
5. ✅ **Original thinking**: Research questions and interpretations are original

**This approach is consistent with**:
- University policies on AI tool usage in coursework
- Academic standards for computational research
- Open science principles of transparency and reproducibility

---

## Version History

**v1.0** (November 2026)
- Initial analysis with SEPA data v3.0
- Three flood scenarios (H/M/L)
- SIMD deprivation analysis
- Interactive map and dashboards
