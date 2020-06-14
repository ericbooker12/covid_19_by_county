import pandas as pd
import numpy as np
import datetime

url = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv"

# url = "./static/county_data/all_counties.csv"



def get_all_data():

	data =  pd.read_csv(url)
	create_csv("US Data", data)

	return data

def get_california_data():
	# population_data = pd.read_csv("./static/data/population_data/population_data.csv")

	data = get_all_data()

	filter = data.loc[:, "state"] == "California"

	data = data.loc[filter, :]

	data = add_population(data)

	counties = list(data.loc[:, 'county'].unique())
	complete_county_list = get_counties()

	counties_with_no_cases = list(set(complete_county_list) - set(counties))

	populations = population_dict()

	# print(counties_with_no_cases)

	county_list = []
	population_list = []
	population_with_no_cases = []
	non_case_list = []

	for county in counties:
		if(county == "Unknown"):
			continue

		pop = (populations[county].replace(",",""))
		population_list.append(int(pop))
		county_list.append(county)

	for county in counties_with_no_cases:
		if(county == "Unknown"):
			continue

		# print(county)

		pop = (populations[county].replace(",",""))
		population_with_no_cases.append(int(pop))
		non_case_list.append(0)


	# for county in complete_county_list:
	# 	if county not in county_list:
	# 			county_list.append(county)

	# for county in counties:
	# 	if(county == "Unknown"):
	# 		continue
	# 	pop = (populations[county].replace(",",""))

	# 	population_list.append(int(pop))




	# for county in counties:
	# 	if(county == "Unknown"):
	# 		continue
	# 	pop = (populations[county].replace(",",""))

	# 	population_list.append(int(pop))

	cases = data.groupby(['county'], sort=False)['cases'].max()

	cases = cases.drop(labels='Unknown')

	case_list = list(cases)

	county_list = county_list + counties_with_no_cases
	population_list = population_list + population_with_no_cases
	case_list = case_list + non_case_list

	df_list = [county_list, case_list, population_list]

	df_list = list(map(list, zip(*df_list))) #transpose list

	df = pd.DataFrame(df_list, columns =['county', 'cases', 'population'])

	df['cases_per_capita'] = (df['cases'] * 100000 / df['population']).astype(int)


	df = df.sort_values(by=['county'])

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
	print("in add population")
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


	data.loc[:, 'population'] = population_data

	print(data)

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

	county_data.loc[:, "new_cases"] = new_cases
	county_data.loc[:0, "new_cases"] = county_data.loc[:0, "cases"]

	return county_data

def get_state_list():
	states = np.sort(data.loc[:, "state"].unique())
	return states.tolist()

def get_county_list(data, state):
	filter = (data.loc[:, 'state'] == state)
	data = data.loc[filter, :]
	counties = np.sort(data.loc[:, 'county'].unique())

	return counties

def get_dataset(data, county):
	filter = data.loc[:, "county"] == county
	county_data = data.loc[filter, :]
	# Add new_cases column
	new_cases = get_new_cases(county_data)

	county_data.loc[:, "new_cases"] = new_cases
	population = pd.Series()

	return county_data

# def createDataset3(data, county, state):

# 	county = self.countyList.currentText()
# 	state = self.stateList.currentText()
# 	fromDate = self.fromDateList.currentText()
# 	toDate = self.toDateList.currentText()

# 	filter = (
# 		(data.loc[:, 'county'] == county) &
# 		(data.loc[:, 'state'] == state)
# 	)

# 	county_data = data.loc[filter, :]
# 	new_cases = self.getNewCases(county_data)
# 	new_deaths = self.getNewDeaths(county_data)

# 	county_data.loc[:, 'new_cases'] = new_cases
# 	county_data.loc[:, 'new_deaths'] = new_deaths

# 	filter = (
# 		(county_data.loc[:, 'date'] >= fromDate) &
# 		(county_data.loc[:, 'date'] <= toDate)
# 	)

# 	county_data = county_data.loc[filter, :]

# 	return county_data

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
				'Humboldt','Imperial','Inyo','Kern','Kings','Lake', 'Lassen',
				'Los Angeles','Madera', 'Marin', 'Mariposa','Mendocino','Merced',
				'Modoc', 'Mono','Monterey','Napa', 'Nevada','Orange','Placer',
				'Plumas','Riverside','Sacramento','San Benito','San Bernardino',
				'San Diego','San Francisco','San Joaquin','San Luis Obispo',
				'San Mateo', 'Santa Barbara','Santa Clara','Santa Cruz','Shasta',
				'Sierra', 'Siskiyou','Solano', 'Sonoma','Stanislaus','Sutter',
				'Tehama', 'Trinity', 'Tulare','Tuolumne', 'Ventura', 'Yolo', 'Yuba']

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

	data.to_csv(path_or_buf='static/county_data/' + name_string + '.csv', index=False)

def snake_it(name):
	name = name.lower().split(" ")
	joiner = "_"
	name = "_".join(name)
	return name








