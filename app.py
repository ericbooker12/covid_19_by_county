from flask import Flask, render_template, request, redirect, url_for, jsonify
from model import get_state_list
from model import	get_all_data
from model import	get_county_list
from model import	get_all_data
from model import	get_dataset
from model import	format_date
from model import	get_counties
from model import get_county_data
from model import create_csv
from model import get_california_data

import io
import random
from flask import Flask, Response, request
from matplotlib.backends.backend_agg import FigureCanvasAgg
from matplotlib.backends.backend_svg import FigureCanvasSVG
import numpy as np

from matplotlib.figure import Figure
import matplotlib.pyplot as plt
from matplotlib.pyplot import figure

# do this to keep program from crashing after plotting
plt.switch_backend('Agg')

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def index():

	california_data = get_california_data()

	create_csv("All Counties", california_data)


	counties = get_counties()

	return render_template("counties.html", counties = counties)

@app.route("/<county>", methods=["GET", "POST"])
def show_data(county):

	county_data = get_county_data(county)

	county_data_json = county_data.to_json(orient="records")

	create_csv(county, county_data)

	return county_data_json


@app.route("/all_data", methods=["GET", "POST"])
def all_data():

	data = get_all_data()


	return render_template("all_data.html")

@app.route("/process", methods=["GET", "POST"])
def process():
	counties = get_counties()
	county_data = get_county_data("San Diego")

	if request.method == "POST":
		name = request.form['textInput']
		return "<h1>{} was submitted</h1>".format(newName)

	return render_template("counties.html", counties = counties )


if __name__ == '__main__':
	app.run(debug=True)












