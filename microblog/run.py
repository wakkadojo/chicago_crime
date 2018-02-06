#!/usr/bin/env python3
from app import app
from random import randint

if __name__ == '__main__':

    app.secret_key = str(randint(0, 1000000000))
    app.run(debug = True)
