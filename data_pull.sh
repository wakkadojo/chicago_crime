#!/usr/bin/env bash

echo_fmt_set="\e[1m\e[32m"
echo_fmt_reset="\e[0m\n"

# Crime data
echo -e "${echo_fmt_set}Pulling data dependencies...${echo_fmt_reset}"

echo -e "${echo_fmt_set}==> Pulling raw reported crimes..."
#wget "https://data.cityofchicago.org/api/views/ijzp-q8t2/rows.csv" -O data/chicago_crime_data.csv

echo -e "${echo_fmt_set}==> Pulling Chicago Community Area geography...${echo_fmt_reset}"
# community area geo json
wget "https://data.cityofchicago.org/api/geospatial/cauq-8yn6?method=export&format=GeoJSON" -O data/chicago_commarea_geo_data.json

echo -e "${echo_fmt_set}==> Pulling Chicago city boundary...${echo_fmt_reset}"
# City outline geo json
wget "https://data.cityofchicago.org/api/geospatial/ewy2-6yfk?method=export&format=GeoJSON" -O data/chicago_outline_data.json

echo -e "${echo_fmt_set}==> Pulling convictions data from Convictions in Cook project...${echo_fmt_reset}"
# Convictions data from the convicted in cook project http://convictions.smartchicagoapps.org/
python data/pull_google_drive_public_link.py 0B_aXS4x_XvJmazRxaWpPTzRfZms data/cook_county_conviction_records__2005_2009.csv

echo -e "${echo_fmt_set}NIBRS mapping already curated and present in repository${echo_fmt_reset}"
# NIBRS mapping in github already; adapted from http://gis.chicagopolice.org/clearmap_crime_sums/crime_types.html

echo -e "${echo_fmt_set}Rob Paral demographics already curated and present in repository${echo_fmt_reset}"
# Demographics data in github already; adapted from http://www.robparal.com/ChicagoCommunityAreaData.html
