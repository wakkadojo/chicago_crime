HOST=$(shell hostname)
BASEDIR=$(shell pwd)
DATADIR=$(BASEDIR)/data

.PHONY: data

data:
	./data_pull.sh

