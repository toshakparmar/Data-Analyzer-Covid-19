library(plumber)
r <- plumb('./Backend/covid_api.R')
r$run(port=8000)