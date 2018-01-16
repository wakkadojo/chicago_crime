HOST=$(shell hostname)
BASEDIR=$(shell pwd)
DATADIR=$(BASEDIR)/data
nbx := jupyter nbconvert --execute --ExecutePreprocessor.timeout=1000 --to notebook

.PHONY: data

process:
	#nbx --inplace 
	$(nbx) Crime_Severity.ipynb
	$(nbx) Rob_Paral_Data_Preprocessing.ipynb
	$(nbx) Crime_Preprocess.ipynb
	$(nbx) City_Profile.ipynb

data:
	./data_pull.sh

