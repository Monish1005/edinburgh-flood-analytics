# 🌊 Scotland Flood Damage Assessment

A comprehensive web application for assessing flood risk and estimating financial damages using SEPA flood data, Ordnance Survey buildings, SIMD deprivation indices, and EU flood damage curves.

![Premium Dark Mode UI](https://img.shields.io/badge/UI-Premium_Dark_Mode-blueviolet)
![Tech](https://img.shields.io/badge/Tech-Leaflet_|_Chart.js-blue)
![Analysis](https://img.shields.io/badge/Analysis-EU_Damage_Curves-orange)

## ✨ Features

### 📊 **Economic Impact Analysis**
- **Damage Estimation** using calibrated EU depth-damage curves
- **Expected Annual Damage (EAD)** calculations across scenarios
- **Portfolio Risk Analysis** for sectors and postcodes
- **ROI Analysis** for flood mitigation measures

### 🗺️ **Interactive Mapping**
- Beautiful satellite imagery basemap with dark theme
- Multiple flood probability scenarios (High/Medium/Low)
- Building-level risk visualization
- Flood depth heat maps
- SIMD deprivation overlay

### 📈 **Analytics Dashboard**
- Real-time statistics and KPIs
- Interactive charts (damage by scenario, depth distribution)
- Filterable by area, SIMD quintile, property value
- Export capabilities (CSV, reports)

### 🎯 **Key Insights**
1. Buildings at flood risk by probability scenario
2. Financial damage estimates per building
3. Social vulnerability mapping (flood risk + deprivation)
4. Scenario comparison (present day vs climate change)

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ with `geopandas`, `pandas`, `numpy`
- A modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Ensure your datasets are in place:**
   ```
   flood/
   ├── SEPA_River_Flood_Maps_v3_0/
   ├── Building_Property_Datasets/
   └── SG_SIMD_2020/
   ```

2. **Process the data:**
   ```bash
   cd /Users/monish/Documents/flood
   python data-processor.py
   ```
   
   This will:
   - Load SEPA flood extents and depths
   - Load OS Buildings and SIMD data
   - Perform spatial intersections
   - Calculate damages using EU curves
   - Export optimized GeoJSON files to `processed_data/`

3. **Open the web app:**
   ```bash
   # Simply open index.html in your browser
   open index.html
   
   # Or use a local server for best performance:
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

## 📁 Project Structure

```
flood/
├── index.html              # Main application page
├── styles.css              # Premium dark mode UI styling
├── app.js                  # Core application logic & map
├── damage-curves.js        # EU damage curve calculations
├── data-processor.py       # Python data processing pipeline
├── processed_data/         # Generated GeoJSON files
│   ├── flood_extent_high.geojson
│   ├── flood_extent_medium.geojson
│   ├── flood_extent_low.geojson
│   ├── buildings_at_risk.geojson
│   ├── simd.geojson
│   └── summary_stats.json
└── README.md
```

## 🎨 Design Philosophy

This app prioritizes:
- **Premium Aesthetics** - Dark mode with glassmorphism and vibrant gradients
- **Data Clarity** - Clear visualizations that communicate risk effectively
- **Performance** - Optimized GeoJSON, efficient rendering
- **Accessibility** - Semantic HTML, keyboard navigation, ARIA labels

## 🔬 EU Damage Curve Methodology

The app uses **depth-damage functions** calibrated for UK residential properties:

| Depth   | Typical Damage |
|---------|----------------|
| 0-0.5m  | 7-22%         |
| 0.5-1m  | 30-37%        |
| 1-1.5m  | 42-50%        |
| 1.5-2m  | 55-62%        |
| 2-3m    | 67-77%        |
| 3m+     | 80-87%        |

*Source: JRC Guidelines & UK Multi-Coloured Manual*

### Customization
Adjust damage sensitivity and property value multipliers in the Settings tab.

## 📊 Data Sources

- **SEPA Flood Maps v3.0** - Scottish Environment Protection Agency
- **Ordnance Survey Buildings** - UK building footprints
- **SIMD 2020** - Scottish Index of Multiple Deprivation
- **Property Prices** - Sector/postcode average values (user-provided)

## 🛠️ Customization

### Adding Property Price Data

Edit `data-processor.py` to load your property price data:

```python
# Load property prices (CSV format expected)
property_prices = pd.read_csv('property_prices.csv')

# Join to buildings by postcode/sector
buildings = buildings.merge(property_prices, on='postcode', how='left')
```

### Adjusting Damage Curves

Modify `damage-curves.js` `calculateDamageFactor()` to calibrate for your region.

## 📸 Screenshots

The app features:
- **Dark satellite basemap** for dramatic visual impact
- **Color-coded flood zones** (blue=high, orange=medium, green=low)
- **Interactive popups** with building-specific risk data
- **Real-time charts** showing damage distribution
- **Glassmorphism panels** for modern aesthetic

## 🐛 Troubleshooting

**Map not loading?**
- Ensure you have an internet connection (basemap tiles are from external sources)
- Check browser console for errors (F12)

**Data not showing?**
- Run `data-processor.py` first to generate GeoJSON files
- Check that `processed_data/` folder exists and contains .geojson files

**Slow performance?**
- Simplify geometries more aggressively in `data-processor.py`
- Filter to smaller geographic area
- Use a local tile server for basemap

## 🔮 Future Enhancements

- [ ] 3D flood depth visualization
- [ ] Climate change scenario projections
- [ ] Real-time flood warning integration
- [ ] Insurance quote calculator
- [ ] Mitigation strategy ROI calculator
- [ ] Mobile app version
- [ ] PDF report generation
- [ ] API for programmatic access

## 📄 License

This project is for educational and research purposes.

**Data Attribution:**
- SEPA flood data © Scottish Environment Protection Agency
- OS data © Crown copyright and database rights
- SIMD data © Scottish Government

## 🙏 Acknowledgments

- **JRC** for EU flood damage curve methodology
- **SEPA** for comprehensive flood mapping
- **Leaflet.js** for mapping capabilities
- **Chart.js** for beautiful visualizations

## 📧 Questions?

This app was built to demonstrate flood risk assessment with EU damage curves. For questions about the methodology or customization, consult the `eu_damage_curves_reference.md` document.

---

**Built with ❤️ for better flood risk understanding**
