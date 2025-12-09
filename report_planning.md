# Report Planning: Capital Green Spaces Project

## 1. Hypothesis and Problem Statement

### Problem Statement
**The Dual Challenge of Risk and Revenue:**
Edinburgh faces an escalating risk of urban flooding due to climate change, with potential residential damages exceeding £200 million in extreme events. Simultaneously, public funding for greenspace maintenance and new flood defenses is constrained. Current planning frameworks (like SIMD) identify social deprivation but fail to capture **environmental deprivation**—specifically, the unequal burden of flood risk and the lack of protective, high-quality greenspace in vulnerable communities. There is a critical need to identify greenspaces that can serve a dual function: providing significant **flood storage capacity** (Blue-Green Infrastructure) while generating **commercial revenue** to ensure their own financial sustainability.

### Hypothesis
**"Strategic commercialization of specific greenspaces can subsidize their conversion into effective flood storage reservoirs, but current distribution of these commercially viable assets disproportionately favors affluent areas, thereby exacerbating environmental deprivation."**

*Alternative/Softer Hypothesis:* "Integrating commercial viability assessments with flood storage capacity modelling will reveal a network of self-sustaining 'Blue-Green' assets that can cost-effectively mitigate flood risk in Edinburgh’s most environmentally deprived sectors."

## 2. Recommended Visualizations (Maps, Graphs, Imagery)

Based on your datasets (SEPA Flood Maps, OS Buildings, Property Prices, ArcGIS Volumes), the following will be most impactful:

### Maps (The "Where")
1.  **The "Hidden Risk" Map:**
    *   **Layer 1:** SIMD Quintiles (Color-coded).
    *   **Layer 2:** Flood Risk Zones (High/Medium/Low) overlaid.
    *   **Highlight:** Areas with *Low* Social Deprivation (High SIMD) but *High* Flood Risk (e.g., wealthy waterfronts) vs. Areas with "Double Deprivation" (Low SIMD + High Flood Risk).
2.  **The "Opportunity" Map:**
    *   **Points:** Greenspaces sized by **Potential Reservoir Volume** (from your ArcGIS work).
    *   **Color:** Commercial Viability Score (e.g., High for golf courses/parks near transit, Low for isolated patches).
    *   **Context:** Overlaid on the Flood Depth grid to show which high-volume greenspaces sit upstream of high-damage residential clusters.
3.  **Environmental Deprivation Index (EDI) Map:**
    *   A new choropleth map showing your custom EDI score per postcode sector (see methodology below).

### Graphs (The "Why" and "How Much")
1.  **Damage vs. Prevention Potential:**
    *   *X-Axis:* Postcode Sector.
    *   *Bar 1:* Total Estimated Flood Damage (£) (from your analysis).
    *   *Bar 2:* Potential Storage Volume (m³) of nearby greenspaces.
    *   *Goal:* Identify sectors with high damage but low storage capacity (high vulnerability).
2.  **The "Inequality" Scatter Plot:**
    *   *X-Axis:* SIMD Rank.
    *   *Y-Axis:* Flood Risk Exposure (e.g., % of buildings at risk).
    *   *Trendline:* Does flood risk correlate with social deprivation? (Testing the hypothesis).
3.  **Commercial Viability Matrix:**
    *   *X-Axis:* Flood Mitigation Potential (Volume).
    *   *Y-Axis:* Commercial Potential (Revenue/Footfall estimate).
    *   *Quadrants:* Identify "Golden Assets" (High Volume + High Revenue) vs. "Public Subsidy Targets" (High Volume + Low Revenue).

## 3. Methodology: Defining "Environmental Deprivation"

Since you should not recreate SIMD, your **Environmental Deprivation Index (EDI)** should focus strictly on physical/environmental factors that SIMD ignores.

### Proposed Definition
**Environmental Deprivation** in this context is defined as: *"The combined state of high exposure to flood risk and low proximity to protective or high-quality greenspace."*

### Step-by-Step Analysis Plan
1.  **Factor 1: Flood Risk Exposure (The Threat)**
    *   Use your existing `damage_max` or `flood_risk_h/m/l` data.
    *   Normalize this at the Postcode Sector level (e.g., Damage £ per capita or % of properties at risk).
    *   *Score:* 1 (Low Risk) to 10 (High Risk).

2.  **Factor 2: Protective Capacity (The Lack of Defense)**
    *   Use your ArcGIS volume calculations.
    *   Calculate the total *potential flood storage volume* of greenspaces within 500m of each postcode sector.
    *   *Score:* 1 (High Capacity/Protected) to 10 (Low Capacity/Exposed).

3.  **Factor 3: Greenspace Accessibility (The Lack of Amenity)**
    *   Distance to the nearest *usable* greenspace (not just any grass, but one with recreational/commercial value).
    *   *Score:* 1 (Close) to 10 (Far).

### The Comparison (The "So What?")
*   **Calculate EDI:** Sum the scores (Risk + Lack of Defense + Lack of Amenity). High Score = High Environmental Deprivation.
*   **Compare with SIMD:**
    *   Create a scatter plot of EDI vs. SIMD.
    *   **Quadrant Analysis:**
        *   *High SIMD / Low EDI:* The "Ideal" (Wealthy, Safe).
        *   *Low SIMD / High EDI:* "Double Deprivation" (Poor, At Risk) -> **Priority for Government Funding.**
        *   *High SIMD / High EDI:* "Environmental Inequality" (Wealthy but At Risk) -> **Priority for Commercial/Private Funding solutions.**
