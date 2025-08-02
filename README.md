# Urban Pulse 🌆📈

**Urban Pulse** is an interactive dashboard that visualizes global urbanization, migration, and demographic trends using D3.js. The project focuses on clear, responsive, and animated data visualizations with a modern design.


---

## 📊 Visualizations

This dashboard includes five key types of visualizations:

| Type            | Description                                    |
|-----------------|------------------------------------------------|
| **Bar Chart**   | Top megacities by population (2023)           |
| **Scatterplot** | Population density vs. urbanization level     |
| **Heatmap**     | Monthly migration flows (2019–2023)           |
| **Choropleth**  | Urbanization percentage by country            |
| **Treemap**     | Population age structure by region            |

All charts are fully responsive, animated, and include tooltips and legends.

---

## 🧰 Tech Stack

- **HTML5 + CSS3**
- **JavaScript (ES6)**
- **D3.js v7**
- **Bootstrap 5** *(for layout and styles)*
- **CSV / JSON / GeoJSON** for data formats

---

## 📁 Project Structure

```text
Urban-Pulse/
├── index.html
├── style.css
├── script.js
├── charts/
│   ├── barChart.js
│   ├── scatterplot.js
│   ├── heatmap.js
│   ├── choropleth.js
│   └── treemap.js
├── assets/
│   └── datasets/
│       ├── megacities_population.csv
│       ├── migration_months.csv
│       ├── urbanization_by_country.json
│       ├── density_vs_urbanization.json
│       ├── population_age_structure.json
│       └── world.geojson
