from flask import Flask, render_template, request, redirect, url_for, jsonify
import io
import random
from flask import Flask, Response, request
import numpy as np

from model import get_state_list, get_all_data, get_county_list, get_all_data, get_dataset, format_date, get_counties, get_county_data, create_csv, get_california_data


app = Flask(__name__)


@app.route("/", methods=["GET", "POST"])
def index():

	# california_data = get_california_data()
	
	# create_csv("All Counties", california_data)
	# counties = get_counties()

	# return render_template("counties.html", counties = counties)
	return render_template("counties.html")

@app.route("/<county>", methods=["GET", "POST"])
def show_data(county):

	print(county)

	county_data = get_county_data(county)

	
	print(county_data)
	
	county_data_json = county_data.to_json(orient="records")


	create_csv(county, county_data)

	return county_data_json


@app.route("/all_data", methods=["GET", "POST"])
def all_data():

	data = get_all_data()


	return render_template("all_data.html")

@app.route("/animate", methods=["GET", "POST"])
def animate():
	return render_template("animate.html")

@app.route("/bar_chart", methods=["GET", "POST"])
def bar_chart():
	return render_template("bar_chart.html")


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












