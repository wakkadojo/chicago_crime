from flask import render_template, Flask, flash, request
from app import app
import os
import json
import sys

@app.route('/')
@app.route('/index')
def chicago():
    return render_template(
        "chicago.html", 
        title = "Crime In Chicago",
        subtitle = "An exploration of inequality over time",
        background_img_name = "chicago_skyline_style_xfer.jpg"
    )

