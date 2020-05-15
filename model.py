import pandas as pd
import numpy as np
import datetime

url = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv"

def get_all_data():

	return pd.read_csv(url)


def get_county_data(county):

	data = get_all_data()
	filter = (data.loc[:, "county"] == county) & (data.loc[:, "state"] == "California")
	# & data.loc[:, "state"] == "California"
	county_data = data.loc[filter, :]
	county_data = county_data.reset_index(drop=True)

	print(county)
	print(county_data.count())
	# print(county_data.info())



	new_cases = get_new_cases(county_data)
	# population = getPopulation(county)

	county_data.loc[:, "new_cases"] = new_cases
	county_data.loc[:0, "new_cases"] = county_data.loc[:0, "cases"]

	return county_data

def get_state_list():
	states = np.sort(data.loc[:, "state"].unique())
	return states.tolist()

def get_county_list(data, state):
	filter = (data.loc[:, 'state'] == state)
	data = data.loc[filter, :]
	# print(data)
	counties = np.sort(data.loc[:, 'county'].unique())

	return counties

def get_dataset(data, county):
	filter = data.loc[:, "county"] == county
	county_data = data.loc[filter, :]
	# Add new_cases column
	new_cases = get_new_cases(county_data)

	county_data.loc[:, "new_cases"] = new_cases
	population = pd.Series()


	# print(county_data)

	return county_data

def createDataset3(data, county, state):

	county = self.countyList.currentText()
	state = self.stateList.currentText()
	fromDate = self.fromDateList.currentText()
	toDate = self.toDateList.currentText()

	filter = (
		(data.loc[:, 'county'] == county) &
		(data.loc[:, 'state'] == state)
	)

	county_data = data.loc[filter, :]
	new_cases = self.getNewCases(county_data)
	new_deaths = self.getNewDeaths(county_data)

	county_data.loc[:, 'new_cases'] = new_cases
	county_data.loc[:, 'new_deaths'] = new_deaths

	filter = (
		(county_data.loc[:, 'date'] >= fromDate) &
		(county_data.loc[:, 'date'] <= toDate)
	)

	county_data = county_data.loc[filter, :]

	return county_data

def format_date(dates):

	formated_date_list=[]

	for d_str in dates:
		d = datetime.datetime.strptime(d_str, '%Y-%m-%d')
		# formated_date_list[d_str] = str(d.strftime("%b %d, %Y"))
		formated_date_list.append(str(d.strftime("%b %d, %Y")))

	# Convert python list to pandas series
	formated_date = pd.Series(formated_date_list)
	return formated_date_list

def get_new_cases(data):

	cases = data.loc[:, "cases"]
	# first = data.loc[0, "cases"]

	cases = np.array(cases)
	df = pd.DataFrame(data = cases)
	df = df.diff()
	df = df.fillna(0)

	new_cases = np.array(df)
	# print("****************")
	# print(new_cases)
	# print("****************")

	return new_cases


def get_counties():
	counties = ['Alameda','Alpine','Amador','Butte','Calaveras','Colusa',
							'Contra Costa','Del Norte','El Dorado','Fresno','Glenn',
							'Humboldt','Imperial','Inyo','Kern','Kings','Lake','Los Angeles',
							'Madera','Marin','Mendocino','Merced','Mono','Monterey','Napa','Nevada',
							'Orange','Placer','Plumas','Riverside','Sacramento','San Benito','San Bernardino',
							'San Diego','San Francisco','San Joaquin','San Luis Obispo','San Mateo',
							'Santa Barbara','Santa Clara','Santa Cruz','Shasta','Siskiyou','Solano',
							'Sonoma','Stanislaus','Sutter','Tehama','Tulare','Tuolumne','Unknown',
							'Ventura','Yolo','Yuba']

	return counties


	return county_dict

def get_county_dict(counties):
	county_dict = {}

	for county in counties:
		county_list = county.split(" ")
		joiner = "_"
		joined_county = joiner.join(county_list).lower()
		county_dict[county] = joined_county


	return county_dict

def create_csv(county, data):
	county_string = county.lower().split(' ')
	dash = "_"
	county_string = dash.join(county_string)

	data.to_csv(path_or_buf='static/data/' + county_string + '.csv', index=False)








