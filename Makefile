HOST=$(shell hostname)
BASEDIR=$(shell pwd)
DATADIR=$(BASEDIR)/data
nbx := jupyter nbconvert --execute --ExecutePreprocessor.timeout=1000 --to notebook

.PHONY: data

process:
	$(nbx) Crime_Severity.ipynb
	$(nbx) Rob_Paral_Data_Preprocessing.ipynb
	$(nbx) Crime_Preprocess.ipynb
	$(nbx) City_Profile.ipynb

data:
	./data_pull.sh

dependencies:
	pip install numpy
	pip install rtree
	pip install pandas
	pip install geopandas
	pip install shapely
	pip install matplotlib
	pip install seaborn
	pip install flask
	pip install git+https://github.com/sc3/python-iucr.git
	pip install git+https://github.com/sc3/python-ilcs.git
	pip install nbconvert
