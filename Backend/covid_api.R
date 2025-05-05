library(plumber)
library(jsonlite)
library(tidyverse)
library(httr)

# Global variable to cache data
covid_data <- NULL
last_fetch_time <- NULL
CACHE_DURATION <- 3600  # Cache duration in seconds (1 hour)

# Load COVID-19 data with improved error handling and caching
get_data <- function() {
  # Check if we have cached data that's still valid
  current_time <- Sys.time()
  if (!is.null(covid_data) && !is.null(last_fetch_time) && 
      difftime(current_time, last_fetch_time, units = "secs") < CACHE_DURATION) {
    return(covid_data)
  }
  
  tryCatch({
    # Try to download with timeout to prevent hanging and retry mechanism
    attempt <- 1
    max_attempts <- 3
    
    while (attempt <= max_attempts) {
      message(paste("Attempt", attempt, "to download COVID-19 data"))
      
      resp <- NULL
      error_occurred <- FALSE
      
      # Try to make the HTTP request
      resp <- tryCatch({
        GET(
          "https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv",
          timeout(60)  # 60 second timeout
        )
      }, error = function(e) {
        error_occurred <- TRUE
        message(paste("HTTP request failed on attempt", attempt, ":", e$message))
        return(NULL)
      })
      
      # Check if request was successful
      if (!error_occurred && !is.null(resp) && status_code(resp) == 200) {
        # Convert response to a data frame
        content <- content(resp, "text")
        df <- read_csv(content, show_col_types = FALSE)
        
        # Cache the data
        covid_data <<- df
        last_fetch_time <<- current_time
        
        message("Successfully downloaded and processed COVID-19 data")
        return(df)
      }
      
      # If we reached here, the attempt failed - sleep and try again
      message(paste("Attempt", attempt, "failed. Waiting before retry..."))
      Sys.sleep(2 * attempt)  # Progressive backoff
      attempt <- attempt + 1
    }
    
    # If all attempts failed and we have cached data, return it
    if (!is.null(covid_data)) {
      message("All download attempts failed. Returning cached data.")
      return(covid_data)
    }
    
    # If we have no cached data, try a fallback URL or throw an error
    message("All download attempts failed and no cache available. Trying fallback URL...")
    
    # Try a fallback URL (e.g., a copy of the dataset hosted elsewhere)
    fallback_resp <- GET(
      "https://covid.ourworldindata.org/data/owid-covid-data.csv",
      timeout(60)
    )
    
    if (status_code(fallback_resp) != 200) {
      stop("Both primary and fallback data sources failed")
    }
    
    fallback_content <- content(fallback_resp, "text")
    df <- read_csv(fallback_content, show_col_types = FALSE)
    
    # Cache the data
    covid_data <<- df
    last_fetch_time <<- current_time
    
    return(df)
  }, error = function(e) {
    # If we have cached data, return it even if it's stale
    if (!is.null(covid_data)) {
      message("Error fetching fresh data, returning cached data: ", e$message)
      return(covid_data)
    }
    
    # Last resort: return a minimal sample dataset
    message("Failed to fetch data and no cache available. Creating minimal dataset.")
    minimal_data <- data.frame(
      location = c("Sample Country"),
      date = as.character(Sys.Date()),
      total_cases = 100,
      new_cases = 10,
      total_deaths = 5,
      new_deaths = 1
    )
    return(minimal_data)
  })
}

#* @filter cors
function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  
  if (req$REQUEST_METHOD == "OPTIONS") {
    res$status <- 200
    return(NULL)
  } else {
    plumber::forward()
  }
}

#* Get COVID-19 data for a specific country
#* @get /summary
#* @param country The country to get data for
function(country = "India") {
  tryCatch({
    message(paste("Fetching data for country:", country))
    df <- get_data()
    
    if (!(country %in% df$location)) {
      message(paste("Country not found:", country))
      return(list(error = paste("Country", country, "not found in dataset")))
    }

    result <- df %>%
      filter(location == country) %>%
      select(date, total_cases, new_cases, total_deaths, new_deaths)
    
    # Handle empty result set
    if (nrow(result) == 0) {
      message(paste("No data available for", country))
      return(list(error = paste("No data available for", country)))
    }
    
    message(paste("Successfully fetched data for", country, "-", nrow(result), "records"))
    return(result)
  }, error = function(e) {
    message("Error in /summary endpoint:", e$message)
    return(list(error = paste("Internal server error:", e$message)))
  })
}

#* @get /countries
function() {
  tryCatch({
    message("Fetching list of countries")
    df <- get_data()
    
    if (is.null(df) || nrow(df) == 0) {
      message("No data available to extract countries")
      return(list(error = "No data available to extract countries"))
    }
    
    countries <- unique(df$location)
    
    # Filter out aggregated regions if needed
    # countries <- countries[!countries %in% c("World", "Europe", "Asia", ...)]
    
    message(paste("Successfully fetched", length(countries), "countries"))
    return(countries)
  }, error = function(e) {
    message("Error in /countries endpoint:", e$message)
    return(list(error = paste("Failed to retrieve countries:", e$message)))
  })
}

# Add a simple health check endpoint
#* @get /health
function() {
  return(list(status = "ok", time = Sys.time()))
}