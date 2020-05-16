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
	# get all data here, separate data by county and save them to csv files to be used in d3
	counties = get_counties()

	return render_template("counties.html", counties = counties)

@app.route("/<county>", methods=["GET", "POST"])
def show_data(county):

	print("In show_data")

	county_data = get_county_data(county)
	county_data_json = county_data.to_json(orient="records")

	create_csv(county, county_data)

	return county_data_json


@app.route("/d3")
def graph():
	return render_template("svg.html")

@app.route("/process", methods=["GET", "POST"])
def process():
	counties = get_counties()
	county_data = get_county_data("San Diego")

	if request.method == "POST":
		name = request.form['textInput']
		return "<h1>{} was submitted</h1>".format(newName)

	return render_template("counties.html", counties = counties )


	# lang = request.args.get('language')
	# return jsonify({'name': "ERIC"})
	# return '<h1>The language is : {}</h1>'.format(lang)
	# return request.args





@app.route("/processXX", methods=["POST"])
def processXX():
	print("*" * 20)
	print("in Process")
	print("request.form = ", request.form)
	print("request.args = ", request.args)
	print(request.method)
	print("*" * 20)


	email = request.form['email']
	name = request.form['name']

	print("*" * 20)
	print("name1 = ", name1)
	print("*" * 20)

	if name and email:
		print("*" * 20)
		print("in If")
		print("*" * 20)

		newName = name[::-1]

		return jsonify({'name': newName})

	return jsonify({'error': "Missing data."})

if __name__ == '__main__':
	app.run(debug=True)












