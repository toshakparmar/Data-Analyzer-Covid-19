# COVID-19 Data Analyzer

<div align="center">
  <img src="https://img.shields.io/badge/R-276DC3?style=for-the-badge&logo=r&logoColor=white" alt="R"/>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/Plumber-276DC3?style=for-the-badge&logo=plumber&logoColor=white" alt="Plumber"/>
  <img src="https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logo=recharts&logoColor=white" alt="Recharts"/>
</div>

## 📊 Overview

COVID-19 Data Analyzer is a comprehensive, interactive web application that visualizes and analyzes global COVID-19 pandemic data. Built with R on the backend and React for the frontend, this application provides real-time insights into pandemic trends across countries.

The application fetches data from the renowned [Our World in Data](https://ourworldindata.org/coronavirus) COVID-19 dataset and transforms it into intuitive visualizations that help users understand the pandemic's progression and impact.

## ✨ Features

- **Interactive Dashboard**: Visualize key COVID-19 metrics with an intuitive, responsive interface
- **Multi-Country Analysis**: Compare and analyze data across countries
- **Time Range Selection**: Filter data by time periods (last month, 3 months, 6 months, year, or all time)
- **Multiple Visualization Types**:
  - Daily case and death trends
  - Cumulative growth charts
  - Weekly average analysis
  - Case distribution insights
  - Growth rate calculations
- **Responsive Design**: Optimized for all devices from mobile to desktop
- **Robust Error Handling**: Graceful fallbacks when data source is unavailable
- **Real-time Data**: Automatically fetches the latest available COVID-19 statistics

## 🔍 Visualizations

The application provides several ways to visualize COVID-19 data:

1. **Daily Trends**: Bar charts showing new cases and deaths per day
2. **Cumulative Growth**: Area charts displaying total case and death growth over time
3. **Weekly Averages**: Bar charts showing weekly case and death averages
4. **Case Distribution**: Pie charts illustrating the breakdown of cases
5. **Growth Rate**: Line charts presenting the daily growth rate percentage
6. **Data Tables**: Tabular data showing the raw numbers for recent dates

## 🛠️ Technology Stack

### Backend

- **R**: Main programming language for data processing
- **Plumber**: R package for creating REST APIs
- **dplyr/tidyverse**: For data manipulation and transformation
- **httr**: For HTTP requests to fetch COVID-19 data

### Frontend

- **React**: JavaScript library for building the user interface
- **Recharts**: Charting library based on D3.js
- **Axios**: For making HTTP requests to the backend
- **CSS3**: For styling and responsive design

## 📝 Architecture

The application follows a client-server architecture:

1. **Backend (R + Plumber)**:

   - Fetches data from Our World in Data
   - Processes and cleans the dataset
   - Exposes REST API endpoints for the frontend
   - Implements caching for performance optimization

2. **Frontend (React)**:
   - Provides an intuitive user interface
   - Handles user interactions
   - Manages application state
   - Renders data visualizations
   - Implements responsive design for all screen sizes

## 🚀 Getting Started

### Prerequisites

- R (>= 4.0.0)
- Node.js (>= 14.0.0)
- npm (>= 6.0.0)

### Backend Setup

1. Clone the repository
   ```bash
   git clone https://github.com/toshakparmar/Data-Analyzer-Covid-19.git
   cd Data-Analyzer-Covid-19
   ```
2. Install R dependencies

   ```bash
   # In R console
   R
   install.packages(c("plumber", "tidyverse", "httr", "jsonlite"))
   ```

3. Start the R API server
   ```bash
   Rscript ./Backend/run_api.R
   ```

### Frontend Setup

1. Navigate to the frontend directory
   ```bash
   cd Frontend
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Start the development server
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to
   ```bash
   http://localhost:5173
   ```

## 📱 Usage

- **Select a Country**: Choose from the dropdown menu
- **Set Time Range**: Select your preferred time period for analysis
- **Explore Visualizations**: Navigate through different chart types using the tabs
- **Interact with Charts**: Hover over data points to see detailed information
- **Review Summary Cards**: Check key statistics at the top of the dashboard
- **Analyze Trends**: Use the various charts to identify patterns and trends

## 🔄 Data Source

The application uses the Our World in Data COVID-19 Dataset, which is updated daily and includes data on confirmed cases, deaths, testing, and vaccinations.

In case the primary data source is unavailable, the application includes a fallback mechanism to ensure continuous operation.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to help improve the COVID-19 Data Analyzer.

1. Fork the repository
2. Create your feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add some amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgements

- **Our World in Data** for providing the COVID-19 dataset
- **R Core Team** for the R language
- **Plumber** for the API framework
- **React** for the frontend library
- **Recharts** for the visualization components

<p align="center"> Developed with ❤️ by Toshak Parmar</p> <p align="center"> <i>@CodeSmachers</i> </p>
