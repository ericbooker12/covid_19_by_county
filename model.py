import pandas as pd
import numpy as np
import datetime

# url = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv"

url = "./static/data/all_counties.csv"



def get_all_data():

	return pd.read_csv(url)

def get_california_data():
	# population_data = pd.read_csv("./static/data/population_data/population_data.csv")

	data = get_all_data()
	filter = data.loc[:, "state"] == "California"

	data = data.loc[filter, :]

	counties = list(data.loc[:, 'county'].unique())

	populations = population_dict()
	print("alpine = " + populations["Alpine"])

	county_list = []
	population_list = []

	for county in counties:
		if(county == "Unknown"):
			continue
		county_list.append(county)
		# print(populations[county])
		# population_list.append(populations[county])

	for county in counties:
		if(county == "Unknown"):
			continue
		pop = (populations[county].replace(",",""))

		population_list.append(int(pop))

	cases = data.groupby(['county'], sort=False)['cases'].max()
	case_list = list(cases)

	# data for datafrom: case_list, county_list, population_list

	df_list = [county_list, case_list, population_list]
	df_list = list(map(list, zip(*df_list))) #transpose list

	# print(df_list)


	df = pd.DataFrame(df_list, columns =['county', 'cases', 'population'])

	df['cases_per_capita'] = (df['cases'] * 100000 / df['population']).astype(int)

	# df = df["cases_per_capita"].astype(int)
	print(df)

	df.to_csv(path_or_buf='static/data/population_data/cases_per_capita.csv', index=False)


# 1532, 4187


	return data


def population_dict():
	population_data = pd.read_csv("./static/data/population_data/population_data.csv")

	pop_values = list(population_data.loc[:, "population"])
	county_values = list(population_data.loc[:, "county"])

	population_dict = lists_to_dict(county_values, pop_values)

	return population_dict

def add_population(data):
	population_data = pd.read_csv("./static/data/population_data/population_data.csv")

	pop_values = list(population_data.loc[:, "population"])
	county_values = list(population_data.loc[:, "county"])

	population_dict = lists_to_dict(county_values, pop_values)

	population_data = []

	for index, row in data.iterrows():
		county = row['county']

		if(county == "Unknown"):
			population_data.append(0)
			continue

		population = int(population_dict[county].replace(",",""))

		population_data.append(population)

	# print(population_data)


	data.loc[:, 'population'] = population_data

	# print(data)


	return data

def lists_to_dict(list1, list2):
	return dict(zip(list1, list2))


def get_county_data(county):

	data = get_all_data()
	filter = (data.loc[:, "county"] == county) & (data.loc[:, "state"] == "California")
	# & data.loc[:, "state"] == "California"
	county_data = data.loc[filter, :]
	county_data = county_data.reset_index(drop=True)


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

	cases = np.array(cases)
	df = pd.DataFrame(data = cases)
	df = df.diff()
	df = df.fillna(0)

	new_cases = np.array(df)

	return new_cases


def get_counties():
	counties = ['Alameda','Alpine','Amador','Butte','Calaveras','Colusa',
							'Contra Costa','Del Norte','El Dorado','Fresno','Glenn',
							'Humboldt','Imperial','Inyo','Kern','Kings','Lake','Los Angeles',
							'Madera','Marin','Mendocino','Merced', 'Modoc', 'Mono','Monterey','Napa','Nevada',
							'Orange','Placer','Plumas','Riverside','Sacramento','San Benito','San Bernardino',
							'San Diego','San Francisco','San Joaquin','San Luis Obispo','San Mateo',
							'Santa Barbara','Santa Clara','Santa Cruz','Shasta','Siskiyou','Solano',
							'Sonoma','Stanislaus','Sutter','Tehama','Tulare','Tuolumne',
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

def create_csv(name, data):
	name_string = name.lower().split(' ')
	dash = "_"
	name_string = dash.join(name_string)

	data.to_csv(path_or_buf='static/data/' + name_string + '.csv', index=False)

def snake_it(name):
	name = name.lower().split(" ")
	joiner = "_"
	name = "_".join(name)
	return name








