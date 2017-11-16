from flask import render_template
from app import app


@app.route('/')
@app.route('/index')
def index():
    return render_template(
        "index.html", 
        title = "Jake Ellowitz",
        subtitle = "A man on no mission whatsoever",
        background_img_name = "home-bg.jpg"
    )

@app.route('/chicago')
def chicago():
    return render_template(
        "chicago.html", 
        title = "Crime In Chicago",
        subtitle = "A Portrait of Crime Inequality",
        background_img_name = "chicago_skyline_style_xfer.jpg"
    )
