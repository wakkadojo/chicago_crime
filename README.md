# Crime Inequality in Chicago

This is the source code for the crime inequality in Chicago measurements published on [chicago.crimeinequality.com](http://chicago.crimeinequality.com). Much of the methodology is described at length on that website, though the notebooks used to produce measurements contain additional descriptions and diagnostic plots.

## Producing Crime Measurements

There is a makefile for producing the measurements, including dependencies. You will need python3 and pip. Also, in order to tag many crimes with appropriate neighborhoods, you will need libspatialindex (https://libspatialindex.github.io/). 

You will need to install python dependencies, pull relevant data, and run the code, which can be done as per below.

```
make dependencies
make data
make process
```

**Note that in order to run the entire analysis, you will need 10GB of RAM**, as it is not set up to process subsets: the code processes all 7-ish million crimes at once, each containing multiple string fields and all of this with significant python overhead. 

The total time to pull the data dependencies is roughly 10 minutes on a 1MB/s connection. Note that some data dependencies (chiefly Rob Paral's census data aggregations) are not systematic, but can be made so with some work.

The total time to run the calculations is roughly 25 minutes on a medium powered laptop.

## Hosting the website

The `microblog` directory is your root page to host a flask server. This code also produces the outputs used to host the website, including the active visualizations and source data, including an Apache wsgi configuration file. In case you want to host it locally on your machine without Apache, you can host it directly with flask by running the `microblog/run.py` file.

## Appendix
### List of python dependencies
* numpy
* rtree
* pandas
* geopandas
* shapely
* matplotlib
* seaborn
* flask
* jupyter
* github.com/sc3/python-iucr.git
* github.com/sc3/python-ilcs.git
* nbconvert
