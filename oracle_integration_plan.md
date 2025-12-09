# Appendix: Oracle Database Integration Strategy

## 1. Strategic Rationale: Hybrid GIS-RDBMS Architecture

To address the limitations of file-based geospatial analysis (e.g., GeoPackages) regarding scalability and complex attribute querying, this project implements a **Hybrid Architecture**. While spatial geometries are maintained within a GIS environment (GeoPandas/ArcGIS) for topological operations, attribute data and damage calculations are offloaded to an **Oracle Relational Database Management System (RDBMS)**.

This approach offers three critical advantages:
1.  **Analytical Performance**: Leverages server-side SQL aggregation for rapid reporting on large datasets (78,000+ entities) without memory-intensive local processing.
2.  **Data Integrity**: Enforces strict typing, primary key uniqueness, and referential integrity to prevent data anomalies common in CSV/flat-file storage.
3.  **Scenario Scalability**: Adopts a normalized "Long" table structure to store multi-scenario results (High/Medium/Low) efficiently, allowing for the seamless addition of future climate scenarios without schema alteration.

## 2. Database Schema Design

The database design follows a normalized **Star Schema** approach, consisting of a central dimension table for static building attributes and a fact table for scenario-based damage estimates.

### 2.1 Entity-Relationship Model

*   **`EDINBURGH_BUILDINGS` (Dimension Table)**: Stores static, immutable characteristics of each building.
    *   **Primary Key**: `OSID` (Ordnance Survey Identifier)
    *   **Foreign Key**: `DATAZONE` (Links to SIMD Zones)
*   **`FLOOD_DAMAGES` (Fact Table)**: Stores variable risk assessments and financial damage estimates for each flood simulation scenario.
    *   **Foreign Key**: `OSID` (References `EDINBURGH_BUILDINGS`)
*   **`SIMD_ZONES` (Dimension Table)**: Stores socio-economic deprivation data for each DataZone.
    *   **Primary Key**: `DATAZONE`

### 2.2 Data Definition Language (DDL)

The following SQL statements define the schema structure and integrity constraints.

```sql
-- Table 1: SIMD Zones (Socio-Economic Data)
CREATE TABLE SIMD_ZONES (
    DATAZONE            VARCHAR2(20) NOT NULL,
    DZNAME              VARCHAR2(100),
    QUINTILEV2          NUMBER(1),     -- 1 (Most Deprived) to 5 (Least)
    POPULATION          NUMBER(10),
    
    CONSTRAINT PK_SIMD PRIMARY KEY (DATAZONE),
    CONSTRAINT CHK_QUINTILE CHECK (QUINTILEV2 BETWEEN 1 AND 5)
);

-- Table 2: Static Building Attributes
CREATE TABLE EDINBURGH_BUILDINGS (
    OSID                VARCHAR2(64) NOT NULL,
    POSTCODE_SECTOR     VARCHAR2(10),
    RESIDENTIAL_UNITS   NUMBER(5) DEFAULT 0,
    PROPERTY_VALUE      NUMBER(12, 2),
    DATAZONE            VARCHAR2(20),  -- Link to SIMD
    EASTING             NUMBER(10, 3),
    NORTHING            NUMBER(10, 3),
    
    CONSTRAINT PK_BUILDINGS PRIMARY KEY (OSID),
    CONSTRAINT FK_BUILDING_SIMD FOREIGN KEY (DATAZONE)
        REFERENCES SIMD_ZONES (DATAZONE),
    CONSTRAINT CHK_RES_UNITS CHECK (RESIDENTIAL_UNITS >= 0)
);

-- Table 3: Scenario-Based Damage Estimates
CREATE TABLE FLOOD_DAMAGES (
    OSID                VARCHAR2(64) NOT NULL,
    SCENARIO_ID         VARCHAR2(20) NOT NULL, -- 'HIGH', 'MEDIUM', 'LOW'
    GRIDCODE            NUMBER(3),             -- Flood Depth Band (1, 2, 3)
    DAMAGE_ESTIMATE     NUMBER(12, 2),
    
    CONSTRAINT FK_DAMAGE_BUILDING FOREIGN KEY (OSID) 
        REFERENCES EDINBURGH_BUILDINGS (OSID) ON DELETE CASCADE,
    CONSTRAINT CHK_SCENARIO CHECK (SCENARIO_ID IN ('HIGH', 'MEDIUM', 'LOW'))
);
```

## 3. Spatial ETL Methodology (Extract, Transform, Load)

The integration process utilizes a custom **Spatial ETL** pipeline to bridge the gap between the file-based GIS environment and the Oracle RDBMS. This process ensures data consistency, coordinate system alignment, and schema normalization.

### 3.1 Coordinate Reference System (CRS) Transformation
To ensure accurate topological relationships, all spatial datasets are standardized prior to intersection.
*   **Source CRS**: British National Grid (EPSG:27700) for SEPA Flood Maps.
*   **Target CRS**: WGS84 (EPSG:4326) for web-based visualization, or retained as EPSG:27700 for accurate area/distance calculations during the ETL phase.
*   **Operation**: `ST_Transform` (in PostGIS/Oracle terms) or `to_crs()` (in GeoPandas).

### 3.2 Topological Overlay & Attribute Extraction
Flood depth attributes are assigned to buildings via a **Spatial Intersection** operation.
*   **Algorithm**: A "Point-in-Polygon" or "Intersection" predicate is applied between the building geometry (or centroid) and the flood depth raster/polygon.
*   **Conflict Resolution**: In cases of multiple intersections (e.g., a building spanning two depth zones), the maximum risk value (`MAX(GRIDCODE)`) is retained to ensure a conservative risk assessment.

### 3.3 Schema Normalization (Unpivoting)
The source data exists in a "Wide" format (denormalized). To adhere to **3NF**, an unpivoting operation transforms scenario columns into a normalized "Long" format.

**Exemplary Python ETL Code:**
```python
import geopandas as gpd
import pandas as pd

def transform_to_oracle_schema(gpkg_path, output_dir):
    """
    Performs Spatial ETL to convert GeoPackage to Oracle-ready CSVs.
    """
    # 1. EXTRACT: Load source geospatial data
    buildings = gpd.read_file(gpkg_path)
    
    # 2. TRANSFORM: Unpivot "Wide" columns to "Long" rows
    # This converts columns like 'damage_h', 'damage_m' into rows
    damage_records = []
    scenarios = {'HIGH': 'damage_h', 'MEDIUM': 'damage_m', 'LOW': 'damage_l'}
    
    for scenario_id, col_name in scenarios.items():
        # Filter for relevant entities
        subset = buildings[buildings[col_name] > 0].copy()
        
        # Create normalized records
        for _, row in subset.iterrows():
            damage_records.append({
                'OSID': row['osid'],
                'SCENARIO_ID': scenario_id,
                'DAMAGE_ESTIMATE': row[col_name],
                'GRIDCODE': row[f'gridcode_{scenario_id.lower()[0]}']
            })
            
    flood_damages_df = pd.DataFrame(damage_records)
    
    # 3. LOAD: Export to CSV for SQL*Loader or External Table
    flood_damages_df.to_csv(f"{output_dir}/flood_damages.csv", index=False)
    print(f"Exported {len(flood_damages_df)} normalized records.")
```

## 4. Analytical Implementation (DML)

The Oracle database is utilized to perform high-level aggregation and "Environmental Deprivation" analysis using SQL.

### 4.1 Hotspot Identification
*Query to aggregate total financial risk by postcode sector for the 1-in-200-year (Medium) event.*

```sql
SELECT 
    b.POSTCODE_SECTOR, 
    COUNT(b.OSID) AS AFFECTED_BUILDINGS,
    SUM(d.DAMAGE_ESTIMATE) AS TOTAL_DAMAGE_GBP
FROM 
    EDINBURGH_BUILDINGS b
JOIN 
    FLOOD_DAMAGES d ON b.OSID = d.OSID
WHERE 
    d.SCENARIO_ID = 'MEDIUM'
GROUP BY 
    b.POSTCODE_SECTOR
ORDER BY 
    TOTAL_DAMAGE_GBP DESC;
```


### 4.2 Socio-Economic Vulnerability Analysis (SIMD Integration)
*Query to quantify the "Double Jeopardy" of deprivation and flood risk: calculating the percentage of residential units at risk within the most deprived zones (Quintile 1).*

```sql
SELECT 
    s.DZNAME,
    s.QUINTILEV2,
    COUNT(b.OSID) AS TOTAL_BUILDINGS,
    SUM(CASE WHEN d.DAMAGE_ESTIMATE > 0 THEN 1 ELSE 0 END) AS BUILDINGS_AT_RISK,
    SUM(d.DAMAGE_ESTIMATE) AS TOTAL_DAMAGE
FROM 
    SIMD_ZONES s
JOIN 
    EDINBURGH_BUILDINGS b ON s.DATAZONE = b.DATAZONE
LEFT JOIN 
    FLOOD_DAMAGES d ON b.OSID = d.OSID AND d.SCENARIO_ID = 'LOW' -- 1-in-1000yr event
WHERE 
    s.QUINTILEV2 = 1 -- Most Deprived
GROUP BY 
    s.DZNAME, s.QUINTILEV2
ORDER BY 
    TOTAL_DAMAGE DESC;
```

## 5. Domain Constraints & Integrity

To ensure the reliability of the analysis, the following domain-specific constraints are enforced at the database level:

1.  **Referential Integrity**: The `FK_DAMAGE_BUILDING` constraint ensures that damage estimates cannot exist for non-existent buildings.
2.  **Value Constraints**: `CHK_RES_UNITS` prevents negative unit counts, ensuring logical consistency in housing data.
3.  **Scenario Validation**: `CHK_SCENARIO` restricts data entry to valid simulation scenarios, preventing typo-induced analysis errors.

## 6. Database Design Principles

### 6.1 Normalization (3NF)
The schema is designed to meet **Third Normal Form (3NF)** standards to minimize redundancy and ensure data integrity:
*   **1NF (Atomic Values)**: All attributes (e.g., `DAMAGE_ESTIMATE`) contain single, atomic values.
*   **2NF (No Partial Dependencies)**: In the `FLOOD_DAMAGES` table, the primary key is composite (`OSID` + `SCENARIO_ID`). Attributes like `DAMAGE_ESTIMATE` depend on *both* the building and the scenario, not just one.
*   **3NF (No Transitive Dependencies)**: Static building attributes (e.g., `PROPERTY_VALUE`) are moved to the `EDINBURGH_BUILDINGS` table, removing them from the damage fact table. Deprivation data (`QUINTILEV2`) is moved to `SIMD_ZONES`, linked via `DATAZONE`, ensuring that if a zone's rank changes, it only needs to be updated in one place.

### 6.2 Entity-Relationship Diagram (ERD) Description
*   **SIMD_ZONES (1) ----< (M) EDINBURGH_BUILDINGS**: One DataZone contains many Buildings. (One-to-Many)
*   **EDINBURGH_BUILDINGS (1) ----< (M) FLOOD_DAMAGES**: One Building has many Damage Estimates (one per scenario). (One-to-Many)

![Flood Database ERD](/Users/monish/.gemini/antigravity/brain/7e9dabe7-d16e-481e-a309-452af4d27b69/flood_db_erd_1764191051886.png)

## 7. Web Application Architecture (Future Implementation)

While the current analysis is performed via Python scripts, the database is architected to support a real-time **Flood Risk Dashboard**.

### 7.1 Instant Loss Calculation
In a web context, calculating total damage for a selected area using Python (Pandas) would require loading large files into the server's memory, causing latency. The Oracle database enables **instantaneous aggregation**:
*   **User Action**: Selects "Postcode Sector EH1" and "High Risk Scenario" on the map.
*   **Backend Operation**: Executes a pre-compiled SQL query:
    ```sql
    SELECT SUM(DAMAGE_ESTIMATE) FROM FLOOD_DAMAGES 
    WHERE SCENARIO_ID = 'HIGH' AND OSID IN (SELECT OSID FROM EDINBURGH_BUILDINGS WHERE POSTCODE_SECTOR = 'EH1');
    ```
*   **Result**: The database returns a single number (e.g., "£4.5M") in milliseconds, enabling a responsive user experience.

### 7.2 Dynamic Filtering
The normalized schema allows for complex, multi-dimensional filtering that would be slow in a flat-file system. For example, a user could instantly filter for *"High Risk Buildings in Deprived Areas (Quintile 1)"* by joining `FLOOD_DAMAGES`, `EDINBURGH_BUILDINGS`, and `SIMD_ZONES` in a single optimized query.
