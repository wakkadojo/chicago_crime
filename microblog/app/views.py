from flask import render_template
from app import app


@app.route('/')
@app.route('/index')
def index():
    return render_template(
        "index.html", 
        title = "Jake Ellowitz",
        subtitle = "A Man on no Mission Whatsoever",
        background_img_name = "home-bg.jpg"
    )

@app.route('/chicago')
def chicago():
    return render_template(
        "chicago.html", 
        title = "Crime In Chicago",
        subtitle = "An exploration of inequality over time",
        background_img_name = "chicago_skyline_style_xfer.jpg"
    )

#@app.route('/contact')
#def contact():
#    return render_template(
#        "contact.html",
#        title = "Contact Me",
#        subtitle = "And I will solve all of your problems",
#        background_img_name = "home-bg.jpg"
#    )
