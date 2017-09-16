#!/usr/bin/env sh

#zillow_foreclosure_source="http://files.zillowstatic.com/research/public/Neighborhood/Neighborhood_HomesSoldAsForeclosures-Ratio_AllHomes.csv"
#zillow_foreclosure_filename="zillow_foreclosure_rate_neighborhood.csv"
#curl $zillow_foreclosure_source | head -1 > $zillow_foreclosure_filename
#curl $zillow_foreclosure_source | grep "\"Chicago\",\"IL\"" >> $zillow_foreclosure_filename

#zillow_price_per_sq_foot_source="http://files.zillowstatic.com/research/public/Neighborhood/Neighborhood_MedianValuePerSqft_AllHomes.csv"
#zillow_price_per_sq_foot_filename="zillow_price_per_sq_foot.csv"
#curl $zillow_price_per_sq_foot_source | head -1 > $zillow_price_per_sq_foot_filename
#curl $zillow_price_per_sq_foot_source | grep "\"Chicago\",\"IL\"" >> $zillow_price_per_sq_foot_filename

zillow_price_per_sq_foot_city_source="http://files.zillowstatic.com/research/public/City/City_MedianValuePerSqft_AllHomes.csv"
zillow_price_per_sq_foot_city_filename="zillow_price_per_sq_foot_city.csv"
curl $zillow_price_per_sq_foot_city_source | head -1 > $zillow_price_per_sq_foot_city_filename
curl $zillow_price_per_sq_foot_city_source | grep "\"Chicago\",\"IL\"" >> $zillow_price_per_sq_foot_city_filename


#wget https://www.zillowstatic.com/static/shp/ZillowNeighborhoods-IL.zip -O tmp_zillow_bdry.zip
#unzip tmp_zillow_bdry.zip
#rm tmp_zillow_bdry.zip
