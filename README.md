# COVID-19 by County
  ![screenshot](static/images/COVID-19_screenshot.png)

### Summary
Using Python, Flask JavaScript and D3.js I created a web app that graphical representation of COVID-19 cases in California by county. It uses the Flask framework on the backend where data is downloaded from https://github.com/nytimes/covid-19-data. Python's pandas library is used to process the data and graphical representation is created on the front end with javascript and the D3 library. Topo.json was used to create the clickable map.

Live at: https://showdata-flask2.herokuapp.com/

### Key Features
* Hover over a county to show COVID-19 and population stats
* Click on a county to see a chart reprenting cases and deaths over time
* Counties are colored in varying intensity based on cases per capita
* Use the slider to alter the y-scale exponentially. 
  - This feature emphasizes (exaggerates) the upper or lower range. Because the number of deaths tend to appear as a flat line when compared to the number of cases, an exponential scale allows you to zoom in to show more detail. 

### Installation

Development requires a local installation of Flask.

Once Flask is installed, run the following commands:

```
export FLASK_ENV=development

```
export FLASK_APP=app.py

```
flask run