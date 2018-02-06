from flask import render_template, Flask, flash, request
from flask_sendgrid import SendGrid
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

def send_email(name, email, message):

    msg = 'Name: ' + name + '\n\n'
    msg += 'Email: ' + email + '\n\n'
    msg += message

    app_tmp = Flask(__name__)
    app_tmp.config['SENDGRID_API_KEY'] = os.environ['SENDGRID_KEY']
    app_tmp.config['SENDGRID_DEFAULT_FROM'] = 'chicago@crimeinequality.com'
    sendgrid = SendGrid(app_tmp)
    sendgrid.send_email(
        to_email=[{'email': 'jake.ellowitz@gmail.com'}],
        subject='Chicago Crime Inequality',
        text=msg
    )

@app.route('/contact', methods=['GET', 'POST'])
def contact():

    if request.method == 'POST':
        send_email(request.form['name'], request.form['email'], request.form['message'])
        return render_template(
            "contactSuccess.html",
            title = "Contact Me",
            subtitle = "Share your thoughts!",
            background_img_name = "chicago_skyline_style_xfer.jpg"
        )
    else:
        return render_template(
            "contact.html",
            title = "Contact Me",
            subtitle = "Share your thoughts!",
            background_img_name = "chicago_skyline_style_xfer.jpg"
        )
