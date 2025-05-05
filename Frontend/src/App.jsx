import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

// Color palette for charts
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

// Format large numbers - moved up before it's used in CustomTooltip
const formatNumber = (num) => {
  if (!num && num !== 0) return "N/A";

  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="custom-tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <div key={`tooltip-${index}`} className="custom-tooltip-data">
            <div
              className="color-dot"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}: </span>
            <span style={{ fontWeight: 600 }}>
              {entry.name.toLowerCase().includes("rate")
                ? `${entry.value}%`
                : formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function App() {
  const [countries, setCountries] = useState([]);
  const [selected, setSelected] = useState("India");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChart, setActiveChart] = useState("trends");
  const [timeRange, setTimeRange] = useState("all");
  const [summaryStats, setSummaryStats] = useState({
    totalCases: 0,
    totalDeaths: 0,
    newCases: 0,
    newDeaths: 0,
    caseFatalityRate: 0,
  });

  // Add this component inside your App() function
  const NoDataFallback = ({ country }) => (
    <div className="no-data-fallback">
      <div className="no-data-icon">📊</div>
      <h3>No data available for {country}</h3>
      <p>Try selecting a different country or time range.</p>
      <div className="suggestion">
        <p>Popular countries with good data coverage:</p>
        <div className="suggestion-buttons">
          {[
            "United States",
            "India",
            "United Kingdom",
            "Brazil",
            "Germany",
          ].map((suggestedCountry) => (
            <button
              key={suggestedCountry}
              onClick={() => setSelected(suggestedCountry)}
              className="suggestion-button"
              disabled={!countries.includes(suggestedCountry)}
            >
              {suggestedCountry}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Function to clean up API error responses
  const extractErrorMessage = (err) => {
    if (!err) return "Unknown error";

    // If it's an axios error with a response
    if (err.response && err.response.data) {
      // Handle {"error": "message"} format
      if (typeof err.response.data.error === "string") {
        return err.response.data.error;
      }

      // Handle {"error": ["message1", "message2"]} format
      if (Array.isArray(err.response.data.error)) {
        return err.response.data.error[0];
      }

      return JSON.stringify(err.response.data);
    }

    // If it's just a regular Error object
    if (err.message) {
      return err.message;
    }

    return "Failed to connect to server";
  };

  // Change from useFallbackData to loadFallbackData
  const loadFallbackData = (country) => {
    setLoading(true);
    fetch("/fallback-data.json")
      .then((res) => res.json())
      .then((data) => {
        setCountries(data.countries);

        // If we're looking for a specific country
        if (country && data.countryData && data.countryData[country]) {
          setData(data.countryData[country]);

          // Extract the latest stats
          const latest =
            data.countryData[country][data.countryData[country].length - 1];
          setSummaryStats({
            totalCases: latest.total_cases || 0,
            totalDeaths: latest.total_deaths || 0,
            newCases: latest.new_cases || 0,
            newDeaths: latest.new_deaths || 0,
            caseFatalityRate:
              latest.total_deaths && latest.total_cases
                ? ((latest.total_deaths / latest.total_cases) * 100).toFixed(2)
                : 0,
          });
        } else {
          setData([]);
          setSummaryStats({
            totalCases: 0,
            totalDeaths: 0,
            newCases: 0,
            newDeaths: 0,
            caseFatalityRate: 0,
          });
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Even fallback data failed:", err);
        setError("Unable to load any data. Please check your connection.");
        setLoading(false);
      });
  };

  // Fetch available countries
  const fetchCountries = () => {
    setLoading(true);
    axios
      .get("http://localhost:8000/countries")
      .then((res) => {
        if (res.data && res.data.error) {
          console.error("API returned error:", res.data.error);
          setError(
            typeof res.data.error === "string"
              ? res.data.error
              : "Failed to load countries"
          );
          setLoading(false);
          return;
        }

        // Make sure we've got an array of countries
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCountries(res.data);
          setLoading(false);
        } else {
          throw new Error("Invalid data format received from API");
        }
      })
      .catch((err) => {
        console.error("Error fetching countries:", err);
        console.log("Switching to fallback data...");
        // Use the fallback data
        loadFallbackData();
      });
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch data for selected country with improved error handling
  const fetchCountryData = (country) => {
    if (!country) return;

    setLoading(true);
    setError(null);

    const encodedCountry = encodeURIComponent(country);
    console.log(`Fetching data for ${country} (encoded: ${encodedCountry})`);

    axios
      .get(`http://localhost:8000/summary?country=${encodedCountry}`)
      .then((res) => {
        // Handle API error responses
        if (res.data && res.data.error) {
          console.error("API returned error:", res.data.error);
          setError(
            typeof res.data.error === "string"
              ? res.data.error
              : Array.isArray(res.data.error)
              ? res.data.error[0]
              : "Failed to load data"
          );
          setLoading(false);
          return;
        }

        // Ensure we received an array
        if (!Array.isArray(res.data)) {
          setError("Invalid data format received from API");
          setLoading(false);
          return;
        }

        // Handle empty response
        if (res.data.length === 0) {
          setError(`No data available for ${country}`);
          setLoading(false);
          setData([]);
          setSummaryStats({
            totalCases: 0,
            totalDeaths: 0,
            newCases: 0,
            newDeaths: 0,
            caseFatalityRate: 0,
          });
          return;
        }

        // Format the data for display
        const formattedData = res.data.map((item) => ({
          ...item,
          date: item.date ? item.date.substring(0, 10) : "Unknown date", // Format date if needed
          total_cases: Number(item.total_cases || 0),
          new_cases: Number(item.new_cases || 0),
          total_deaths: Number(item.total_deaths || 0),
          new_deaths: Number(item.new_deaths || 0),
        }));

        // Apply time range filtering
        let filteredData = formattedData;
        if (timeRange !== "all") {
          const now = new Date();
          const pastDate = new Date();

          switch (timeRange) {
            case "1m":
              pastDate.setMonth(now.getMonth() - 1);
              break;
            case "3m":
              pastDate.setMonth(now.getMonth() - 3);
              break;
            case "6m":
              pastDate.setMonth(now.getMonth() - 6);
              break;
            case "1y":
              pastDate.setFullYear(now.getFullYear() - 1);
              break;
            default:
              break;
          }

          filteredData = formattedData.filter(
            (item) => new Date(item.date) >= pastDate
          );
        }

        setData(filteredData);

        // Calculate summary statistics
        if (filteredData.length > 0) {
          // Get the latest data point with non-null values
          const latestValid =
            [...filteredData]
              .reverse()
              .find(
                (item) =>
                  (item.total_cases !== null &&
                    item.total_cases !== undefined) ||
                  (item.total_deaths !== null &&
                    item.total_deaths !== undefined)
              ) || {};

          const totalCases = Number(latestValid.total_cases || 0);
          const totalDeaths = Number(latestValid.total_deaths || 0);
          const newCases = Number(latestValid.new_cases || 0);
          const newDeaths = Number(latestValid.new_deaths || 0);

          const cfr =
            totalCases > 0 ? ((totalDeaths / totalCases) * 100).toFixed(2) : 0;

          console.log("Latest data:", latestValid);
          console.log("Calculated stats:", {
            totalCases,
            totalDeaths,
            newCases,
            newDeaths,
            cfr,
          });

          setSummaryStats({
            totalCases,
            totalDeaths,
            newCases,
            newDeaths,
            caseFatalityRate: cfr,
          });
        } else {
          // Set default values if no data
          setSummaryStats({
            totalCases: 0,
            totalDeaths: 0,
            newCases: 0,
            newDeaths: 0,
            caseFatalityRate: 0,
          });
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error(`Error fetching data for ${country}:`, err);
        console.log("Switching to fallback data...");
        // Use the fallback data instead
        loadFallbackData(country);
      });
  };

  useEffect(() => {
    fetchCountryData(selected);
  }, [selected, timeRange]);

  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    console.log(`Changing country from ${selected} to ${newCountry}`);
    setSelected(newCountry);
  };

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  // Calculate daily growth rate
  const calculateGrowthRate = () => {
    if (data.length < 2) return [];

    return data
      .map((item, index) => {
        if (index === 0 || !item.total_cases || !data[index - 1].total_cases) {
          return { ...item, growth_rate: 0 };
        }
        const growthRate =
          ((item.total_cases - data[index - 1].total_cases) /
            data[index - 1].total_cases) *
          100;
        return { ...item, growth_rate: parseFloat(growthRate.toFixed(2)) };
      })
      .filter(
        (item) => item.growth_rate !== Infinity && !isNaN(item.growth_rate)
      );
  };

  // Prepare data for distribution chart
  const prepareDistributionData = () => {
    if (data.length === 0) return [];

    const latest = data[data.length - 1];
    return [
      { name: "Cases", value: latest.total_cases - latest.total_deaths || 0 },
      { name: "Deaths", value: latest.total_deaths || 0 },
    ];
  };

  // Prepare weekly average data
  const prepareWeeklyData = () => {
    if (data.length === 0) return [];

    const weeklyData = [];
    let currentWeek = {
      week: "",
      avg_new_cases: 0,
      avg_new_deaths: 0,
      total_cases: 0,
      total_deaths: 0,
    };
    let dayCount = 0;

    data.forEach((day, i) => {
      const date = new Date(day.date);
      const weekNumber = getWeekNumber(date);
      const weekLabel = `Week ${weekNumber} ${date.getFullYear()}`;

      if (i === 0) {
        currentWeek.week = weekLabel;
      }

      if (currentWeek.week === weekLabel) {
        currentWeek.avg_new_cases += day.new_cases || 0;
        currentWeek.avg_new_deaths += day.new_deaths || 0;
        currentWeek.total_cases = day.total_cases || 0;
        currentWeek.total_deaths = day.total_deaths || 0;
        dayCount++;
      } else {
        if (dayCount > 0) {
          currentWeek.avg_new_cases = parseFloat(
            (currentWeek.avg_new_cases / dayCount).toFixed(2)
          );
          currentWeek.avg_new_deaths = parseFloat(
            (currentWeek.avg_new_deaths / dayCount).toFixed(2)
          );
          weeklyData.push(currentWeek);
        }

        currentWeek = {
          week: weekLabel,
          avg_new_cases: day.new_cases || 0,
          avg_new_deaths: day.new_deaths || 0,
          total_cases: day.total_cases || 0,
          total_deaths: day.total_deaths || 0,
        };
        dayCount = 1;
      }

      // Handle last week
      if (i === data.length - 1) {
        if (dayCount > 0) {
          currentWeek.avg_new_cases = parseFloat(
            (currentWeek.avg_new_cases / dayCount).toFixed(2)
          );
          currentWeek.avg_new_deaths = parseFloat(
            (currentWeek.avg_new_deaths / dayCount).toFixed(2)
          );
          weeklyData.push(currentWeek);
        }
      }
    });

    return weeklyData;
  };

  // Helper function to get week number
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  return (
    <div className="App">
      <div className="app-header">
        <img src="/covid-icon.svg" alt="COVID-19 Logo" className="logo" />
        <h1>COVID-19 Data Analyzer</h1>
      </div>

      <div className="controls">
        <div className="control-group">
          <label htmlFor="country-select">Country: </label>
          <select
            id="country-select"
            value={selected}
            onChange={handleCountryChange}
            disabled={loading || countries.length === 0}
          >
            {countries.length > 0 ? (
              countries.map((country, index) => (
                <option key={`country-${index}`} value={country}>
                  {country}
                </option>
              ))
            ) : (
              <option value="">Loading countries...</option>
            )}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="time-range">Time Range: </label>
          <select
            id="time-range"
            value={timeRange}
            onChange={handleTimeRangeChange}
            disabled={loading}
          >
            <option value="all">All Time</option>
            <option value="1y">Last Year</option>
            <option value="6m">Last 6 Months</option>
            <option value="3m">Last 3 Months</option>
            <option value="1m">Last Month</option>
          </select>
        </div>

        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search for a country..."
            className="search-input"
            onChange={(e) => {
              const searchTerm = e.target.value.toLowerCase();
              const filtered = countries.filter((country) =>
                country.toLowerCase().includes(searchTerm)
              );
              // Either update the dropdown options or show a separate list
            }}
          />
        </div>
      </div>

      {/* <button
        onClick={() => {
          console.log("Current state:", {
            selected,
            countriesCount: countries.length,
            dataPoints: data.length,
          });
          console.log(
            "API URL:",
            `http://localhost:8000/summary?country=${selected}`
          );
        }}
        style={{ margin: "10px 0", padding: "5px", background: "#f0f0f0" }}
      >
        Debug
      </button> */}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error">{error}</p>
          <button
            className="retry-button"
            onClick={() => {
              setError(null);
              setLoading(true);

              // Try the API first
              if (error.includes("countries")) {
                fetchCountries();
              } else {
                fetchCountryData(selected);
              }
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div>
          {/* Summary Cards */}
          <div className="dashboard">
            <div className="card">
              <div className="card-title">Total Cases</div>
              <div className="card-value">
                {formatNumber(summaryStats.totalCases)}
              </div>
              <div
                className={`card-change ${
                  summaryStats.newCases > 0 ? "positive" : ""
                }`}
              >
                +{formatNumber(summaryStats.newCases)} new
              </div>
            </div>
            <div className="card">
              <div className="card-title">Total Deaths</div>
              <div className="card-value">
                {formatNumber(summaryStats.totalDeaths)}
              </div>
              <div
                className={`card-change ${
                  summaryStats.newDeaths > 0 ? "positive" : ""
                }`}
              >
                +{formatNumber(summaryStats.newDeaths)} new
              </div>
            </div>
            <div className="card">
              <div className="card-title">Case Fatality Rate</div>
              <div className="card-value">{summaryStats.caseFatalityRate}%</div>
            </div>
          </div>

          {/* Chart type tabs */}
          <div className="chart-tabs">
            <button
              className={`tab-button ${
                activeChart === "trends" ? "active" : ""
              }`}
              onClick={() => setActiveChart("trends")}
            >
              Daily Trends
            </button>
            <button
              className={`tab-button ${
                activeChart === "cumulative" ? "active" : ""
              }`}
              onClick={() => setActiveChart("cumulative")}
            >
              Cumulative Growth
            </button>
            <button
              className={`tab-button ${
                activeChart === "weekly" ? "active" : ""
              }`}
              onClick={() => setActiveChart("weekly")}
            >
              Weekly Averages
            </button>
            <button
              className={`tab-button ${
                activeChart === "distribution" ? "active" : ""
              }`}
              onClick={() => setActiveChart("distribution")}
            >
              Case Distribution
            </button>
            <button
              className={`tab-button ${
                activeChart === "growthRate" ? "active" : ""
              }`}
              onClick={() => setActiveChart("growthRate")}
            >
              Growth Rate
            </button>
          </div>

          {activeChart === "trends" && (
            <div className="chart-container">
              <h2>Daily Cases and Deaths for {selected}</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(date) => {
                      // Show fewer labels on small screens
                      const d = new Date(date);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    interval={Math.floor(data.length / 20)} // Adjust based on data size
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="new_cases" name="New Cases" fill="#8884d8" />
                  <Bar dataKey="new_deaths" name="New Deaths" fill="#ff7300" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === "cumulative" && (
            <div className="chart-container">
              <h2>Cumulative Cases and Deaths for {selected}</h2>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getMonth() + 1}/${d.getDate()}/${d
                        .getFullYear()
                        .toString()
                        .substr(2)}`;
                    }}
                    interval={Math.floor(data.length / 10)}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="total_cases"
                    name="Total Cases"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_deaths"
                    name="Total Deaths"
                    stroke="#ff7300"
                    fill="#ff7300"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === "weekly" && (
            <div className="chart-container">
              <h2>Weekly Averages for {selected}</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={prepareWeeklyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="avg_new_cases"
                    name="Avg New Cases"
                    fill="#82ca9d"
                  />
                  <Bar
                    dataKey="avg_new_deaths"
                    name="Avg New Deaths"
                    fill="#ff7300"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === "distribution" && (
            <div className="charts-grid">
              <div className="chart-container">
                <h3>Case Distribution for {selected}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prepareDistributionData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(1)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareDistributionData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Trend Analysis</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart
                    outerRadius={90}
                    data={[
                      {
                        subject: "Cases",
                        A: summaryStats.totalCases > 0 ? 100 : 0,
                      },
                      {
                        subject: "Deaths",
                        A:
                          summaryStats.totalDeaths > 0
                            ? (summaryStats.totalDeaths /
                                summaryStats.totalCases) *
                              100
                            : 0,
                      },
                      {
                        subject: "New Cases",
                        A:
                          summaryStats.newCases > 0
                            ? (summaryStats.newCases /
                                summaryStats.totalCases) *
                              100
                            : 0,
                      },
                      {
                        subject: "New Deaths",
                        A:
                          summaryStats.newDeaths > 0
                            ? (summaryStats.newDeaths /
                                summaryStats.totalDeaths) *
                              100
                            : 0,
                      },
                      {
                        subject: "Fatality",
                        A: summaryStats.caseFatalityRate,
                      },
                    ]}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="COVID-19 Metrics"
                      dataKey="A"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeChart === "growthRate" && (
            <div className="chart-container">
              <h2>Daily Growth Rate for {selected}</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={calculateGrowthRate()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    interval={Math.floor(calculateGrowthRate().length / 15)}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="growth_rate"
                    name="Daily Growth Rate (%)"
                    stroke="#ff7300"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Data table section */}
          <div className="data-table-container">
            <h3>Recent Data</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>New Cases</th>
                  <th>Total Cases</th>
                  <th>New Deaths</th>
                  <th>Total Deaths</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(-10).map((item, index) => (
                  <tr key={index}>
                    <td>{item.date}</td>
                    <td>{item.new_cases || 0}</td>
                    <td>{item.total_cases || 0}</td>
                    <td>{item.new_deaths || 0}</td>
                    <td>{item.total_deaths || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && !error && data.length === 0 && (
            <NoDataFallback country={selected} />
          )}
        </div>
      )}
      <footer className="footer">
        <p>Data source: Our World in Data - COVID-19 dataset</p>
        <p>
          &copy; {new Date().getFullYear()} COVID-19 Data Analyzer. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}

export default App;
