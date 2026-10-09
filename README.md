# 🏛️ Gefährdete Denkmale in Deutschland (Endangered Heritage Sites)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23244912.svg)](https://doi.org/10.5281/zenodo.23244912)
[![Version](https://img.shields.io/badge/version-v1.1.0-blue.svg)](https://github.com/sarahelhnbaly/Gefaehrdte_Denkmaeler_in_Deutschland-)
[![Release Date](https://img.shields.io/badge/release-Oct%208%2C%202026-green.svg)](https://doi.org/10.5281/zenodo.23244912)

An interactive Web-GIS application designed to visualize and monitor endangered cultural heritage monuments across Germany. This project bridges digital archaeology and modern web mapping techniques, transforming spatial heritage data into an engaging and accessible public interface.

🔗 **[Live Demo](https://sarahelhnbaly.github.io/Gefaehrdte_Denkmaeler_in_Deutschland-/)**  
📦 **DOI (Zenodo Archive):** [10.5281/zenodo.23244912](https://doi.org/10.5281/zenodo.23244912)

---

## 📌 Project Overview

Cultural heritage sites face increasing risks ranging from neglect and structural degradation to urban development. This web application offers an intuitive spatial dashboard to explore vulnerable monuments, their current status, threat categories, and geographic distribution across the German federal states (*Bundesländer*).

---

## ✨ Key Features

* **Interactive Map Exploration:** Powered by Leaflet.js with custom styling, custom UI controls, and responsive navigation.
* **Dual Theme Support:** Custom Dark and Light mode toggle for optimal map visibility and accessibility.
* **Dynamic Information Cards (*Karteikarten*):** Synchronized UI cards connected to map features, enabling intuitive site-level inspection.
* **Address & Location Search:** Integrated geocoding search covering locations across Germany.
* **Custom Responsive UI:** Clean separation of data visualization, legend, metadata sources, and responsive viewport sizing.

---

## 🛠️ Tech Stack & Workflow

* **GIS & Data Processing:** QGIS, PostGIS, GeoJSON, spatial layer optimization.
* **Frontend Development:** HTML5, CSS3, JavaScript, Leaflet.js.
* **Modern Development Assistance:** Leveraged AI code synthesis and iterative prompt engineering for interface components and custom logic.
* **Export & Adaptation:** Extended and customized from raw `qgis2web` exports into a fully decoupled, custom web application.

---

## 📂 Project Structure

```text
├── index.html            # Main web application entry point
├── data/                 # Spatial data layers (denkmale.geojson, etc.)
├── css/                  # Custom UI styles, theme variables, and layout
├── js/                   # Interactive map logic, UI card synchronization
└── assets/               # Icons, markers, and project documentation images
