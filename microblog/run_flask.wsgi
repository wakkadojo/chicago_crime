#!/usr/bin/env python3

import os
import sys

sys.path.insert(0, '/var/www/html/microblog')

def application(environ, start_response):
    # pass sendgrid api key as set in Apache config
    os.environ['SENDGRID_KEY'] = environ['SENDGRID_KEY']
    from app import app

    return app(environ, start_response)
