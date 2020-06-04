$(document).ready(function() {

	Promise.all([
			d3.json('./static/topodata/cal_counties.topo.json'),
			d3.csv('./static/county_data/all_counties.csv'),
			d3.csv('./static/data/population_data/cases_per_capita.csv'),
			d3.csv('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv')
		]).then(([topology, californiaData, perCapita, covidData]) => {



			covidData = covidData.filter(d => {
				return (
					d.state == "California"
				);
			});

			let colorInterpolations = [
				d3.interpolateReds, //0
				d3.interpolatePurples, //1
				d3.interpolateRdGy, //2
				d3.interpolateOranges, //3
				d3.interpolateRdPu, //4
				d3.interpolateYlOrRd, //5
				d3.interpolateHsl, //6
				d3.interpolateLab, //7
				d3.interpolateBuPu, //8
				d3.interpolateBuGn //9
			]

			let colorScheme = colorInterpolations[5];
			let countyMap = new D3Map(topology, californiaData, perCapita, covidData)
			let countyGroup = countyMap.drawCounties(colorScheme)

			countyMap.colorCounties(countyGroup, colorScheme)
				// map.drawBubbles(countryGroup)
				// map.drawCapitals(capitals)
			countyMap.drawLegend(colorScheme)

		})
		.catch((err) => console.error('Error retrieving data:', err))
})

class Tooltip {
	constructor(svgX, svgY, data, perCapitaData) {
		this.data = data
		this.svgX = svgX
		this.svgY = svgY
		this.perCapita = perCapitaData

		this.div = d3.select('body').append('div')
			.attr('class', 'tooltip')
			.style('opacity', 0);

	}

	showStats(x, y, county) {

		// console.log(county)

		this.remove()

		let countyName;
		let cases;
		let deaths;
		let population;
		let perCapita;

		this.data.forEach((d) => {
			if (d.county == county.properties.name) {
				countyName = d.county
				cases = d.cases
				deaths = d.deaths
				population = d.population
			}
		})

		if (isNaN(cases)) {
			cases = 0
		}

		this.perCapita.forEach(function(x) {
			if (x.county == countyName) {
				perCapita = x.cases_per_capita
			}
		})

		this.div.transition().duration(200).style('opacity', 1)

		this.div
			.html(`
				<strong class='title'>${countyName} County</strong><br/>
				<span>Cases: ${numberWithCommas(cases)}</span><br/>
				<span>Deaths: ${deaths}</span><br/>
				<span>Population: ${numberWithCommas(population)}</span><br/>
				<span>Cases per 100k: ${perCapita}</span><br/>
			`)
			// .style('left', x + this.svgX + 'px')
			// .style('top', y + this.svgY + 'px')
			.style('left', '20px')
			.style('top', '500px')
	}

	showChartStats(x, y, county) {
		// console.log(x, y, county)

		let date = county.date
		let cases = county.cases
		let deaths = county.deaths

		this.div.transition().duration(200).style('opacity', 1)


		this.div
			.html(`
				<strong>${date} County</strong><br/>
				<span>Cases: ${cases}</span><br/>
				<span>Deaths: ${deaths}</span><br/>
			`)
			// .style('left', x + this.svgX + 'px')
			// .style('top', y + this.svgY + 'px')
			.style('left', '20px')
			.style('top', '600px')
	}

	remove() {
		this.div.transition().duration(200).style('opacity', 0)
	}

}

class D3Map {
	constructor(topology, covidData, perCapita, covidData2) {

		this.covidData2 = covidData2


		// Get population data from perCapita

		// console.log(perCapita)

		this.svg = d3.select('.sidebar')
			.append('svg')
			.attr('id', 'map')
			.attr('height', 600)
			.attr('width', 400)

		let { height, width, x, y } = document.getElementById('map')
			.getBoundingClientRect()

		const geojson = topojson.feature(topology, topology.objects['california_counties'])

		this.counties = geojson.features
			// this.projection = d3.geoAlbers() //set rotate to -30
		this.projection = d3.geoMercator()
		this.projection
			.fitExtent([
				[0, 0],
				[width - 50, height - 50]
			], geojson)

		const { min, max, minCounty, maxCounty } = getCasesPerCapitaRange(perCapita)


		this.min = min
		this.max = max
		this.minCounty = minCounty
		this.maxCounty = maxCounty
		this.perCapita = perCapita

		this.tooltip = new Tooltip(x, y, covidData, perCapita)

	}

	drawCounties(colorScheme) {
		const path = d3.geoPath().projection(this.projection)

		const scale = getScale(this.min, this.max, colorScheme)
		let casesPerCapita = this.perCapita

		let title = this.svg
			.append('text')
			.attr("x", 30)
			.attr("y", 50)
			.style("font-size", "18px")
			.text("Click a county");

		const countyGroup = this.svg
			.append('g')
			.attr('class', 'counties')
			.selectAll('path')
			.data(this.counties)
			.enter()
			.append('path')
			.attr('d', path)
			.attr('id', function(d) { return snake_it(d.properties.name) })
			.attr('class', "county")
			.attr('stroke', 'lightgray')
			.attr("transform", "translate(20, 0) rotate(0) scale(1)")
			.on('click', (d, i, counties) => {

				// console.log(counties)

				let countyName = d.properties.name

				// let countyData = this.covidData2.filter(data => {
				//     return (
				//         data.county == countyName
				//     );
				// });

				const [x, y] = path.centroid(d)
				this.tooltip.showStats(x, y, d)

				this.showData(d, i, counties)

			})
			.on('mouseover', (d, i, counties) => {
				d3.select(counties[i]).transition().duration(100)
					.attr('fill', 'lightblue')
					// .attr('stroke', 'lightblue')
					.attr('class', 'shadow')
					.attr('opacity', 1)


				const [x, y] = path.centroid(d)

				this.tooltip.showStats(x, y, d)
			})
			.on('mouseout', (d, i, counties) => {
				d3.select(counties[i]).transition().duration(100)
					.attr('stroke', 'lightgray')
					.attr('fill', function(county) {
						let countyName = county.properties.name;
						let cases;

						casesPerCapita.forEach(function(c) {
							if (c.county == countyName) {
								cases = c.cases_per_capita
							}
						})

						return scale(cases)

					})
					.attr('opacity', .8)
			})

		function labels(svg, x, y, name) {
			let joinedName = joinCountyName(name)
		}
		return countyGroup
	}

	colorCounties(countyGroup, colorScheme) {
		const scale = getScale(this.min, this.max, colorScheme)

		let casesPerCapita = this.perCapita

		countyGroup
			.attr('fill', function(county) {
				let countyName = county.properties.name
				let cases

				casesPerCapita.forEach(function(c) {
					if (c.county == countyName) {
						cases = c.cases_per_capita
					}
				})


				return scale(cases)
			})
			.attr('opacity', '.8')
	}

	showData(entity, i, counties, covidData) {

		let countyName = entity.properties.name

		let countyData = this.covidData2.filter(data => {
			return (
				data.county == countyName
			);
		});

		$("#data-source").remove();
		$("#slider-table").attr('hidden', true);
		$(".chart-svg").attr('hidden', true);
		$("#chart").append(`<p id="loading">Fetching data for <strong>${countyName} County</strong>.\n Standby...</p>`);

		$("#countyBtn").removeClass()
		$("#countyBtn").addClass(countyName);
		$("#render_scale").removeClass()
		$("#render_scale").addClass(countyName);

		makeData(countyData, "json", 1, countyName)

		// Make ajax request to app to create and store csv file for current data.
		$.ajax({
				data: $(this).text(),
				type: 'POST',
				url: '/' + countyName
			})
			//     .done(function(response) {

		//         $("#loading").remove();
		//         makeData(response, "ajax", .5, countyName)
		//     });

	}

	showCountyLabel(county, i, counties) {

		const coords = county.geometry.coordinates[0][0][0]
		const x = this.projection(coords)[0]
		const y = this.projection(coords)[1]

		let textSize = 10;
		this.svg
			.append('text')
			.attr('id', countyLabel(county, i))
			.attr('x', x)
			.attr('y', y)
			.attr('font-size', '12px')
			.attr('transform', `translate(7, ${textSize / 2})`)
			.text(county.properties.namelsad, ) //namelsad

		d3.select(counties[i])
			// .attr("class", "selected")
			.attr("opacity", ".5")
	}

	removeCountyLabel(county, i, counties) {
		d3.select('#' + countyLabel(county, i)).remove()

		d3.select(counties[i])
			// .attr("class", "")
			// .attr("opacity", "1")

	}

	drawLegend(colorScheme) {
		const gradient = this.svg
			.append('defs').append('svg:linearGradient')
			.attr('id', 'gradient')
			.attr('x1', '100%')
			.attr('x2', '100%')
			.attr('y1', '0%')
			.attr('y2', '100%')
			.attr('spreadMethod', 'pad')

		const lowColor = colorScheme(0)
		const highColor = colorScheme(1)

		gradient.append('stop')
			.attr('offset', '0%')
			.attr('stop-color', highColor)
			.attr('stop-opacity', 1)

		gradient.append('stop')
			.attr('offset', '100%')
			.attr('stop-color', lowColor)
			.attr('stop-opacity', 1)

		const w = 60
		const h = 240

		const legend = this.svg.append('g')
			.attr('transform', 'translate(310, 70)')

		legend.append('rect')
			.attr('width', w)
			.attr('height', h)
			.style('fill', 'url(#gradient')

		let fontSize = 12
		legend.append('text')
			.attr("x", -13)
			.attr("y", -(fontSize + 4))
			.attr("dy", ".35em")
			.style("font-size", fontSize)
			// .style("font-weight", "bold")
			.text("Cases per 100k");

		const axisScale = d3.scaleLinear()
			.range([h, 0])
			.domain([0, this.max])

		const axis = d3.axisLeft(axisScale)
		legend.append('g')
			.attr('class', 'axis')
			.attr('transform', `translate(0, 0)`)
			.call(axis)

	}

}

function getScale(min, max, colorScheme) {

	const scale = d3.scaleSequential()
		.domain([min, max])
		.interpolator(colorScheme);

	return scale
}

function casesPerCapita(county) {
	return county.properties.name
}

function getCasesPerCapitaRange(counties) {
	let min = Infinity;
	let max = -Infinity;

	counties.forEach((county) => {
		const cpc = parseFloat(county.cases_per_capita)

		if (cpc < min) {
			min = cpc
			minCounty = county.county
		}
		if (cpc > max) {
			max = cpc
			maxCounty = county.county
		}
	})

	return { min, max }
}

function renderChart(value) {

	let county = $("#render_scale").attr("class");

	county_joined = county.toLowerCase().split(' ').join('_')

	let source = "csv"

	d3.csv("/static/county_data/" + county_joined + ".csv")
		.then(function(data) {
			d3.select("#data-source").remove();
			makeData(data, 'csv', value, county)
		});
}

function countyLabel(county) {
	joinedCounty = joinCountyName(county.properties.name)
	return `label_${joinedCounty}`
}

function joinCountyName(county) {
	county = county.toLowerCase().split(" ").join("_")
	return county
}


function makeData(inputData, source, exp, entity) {

	$("#range-value").html(`Y-scale = <span id='range-value-bold'>y^` + exp + `</span>`);
	$("#slider-table").removeAttr('hidden');

	d3.select(".chart-svg").remove();
	d3.select("#data-source").remove();
	d3.select("#loading").remove();

	let data = {};

	if (source == "ajax") {
		data = inputData
		data = JSON.parse(data);
		// console.log("ajax", data[data.length - 1])
	}

	if (source == "csv" || source == "json") {
		data = inputData

		for (let i = 0; i < data.length; i++) {
			for (let item in data[i]) {
				if (item == 'cases' || item == 'deaths' || item == 'new_cases') {
					data[i][item] = parseInt(data[i][item])
				}
			}
		}
	}

	let margin = 50;
	let width = 600;
	let height = 400;

	let chart = d3.select("#chart").append("svg")
		.attr("class", "chart-svg")
		.attr("width", width + 2 * margin)
		.attr("height", height + 2 * margin)
		.append('g')
		.attr("transform", "translate(" + margin + ", " + margin + ")");


	let parseTime = d3.timeParse("%Y-%m-%d");



	data.forEach(function(d) {
		if (typeof d.date == 'string') {
			d.date = parseTime(d.date);
		}
	});

	var x = d3.scaleTime()
		.domain(d3.extent(data, function(d) { return d.date; })) //returns min and max
		.range([0, width]);

	var maxCases = d3.max(data, function(d) { return d.cases })
	var maxDeaths = d3.max(data, function(d) { return d.deaths })
	var minCases = d3.min(data, function(d) { return d.cases })
		// var numOfDataPoints = d3.min(data, function(d) {return d.date})

	// console.log("numOfDataPoints: ", numOfDataPoints)

	var y = d3.scalePow()
		.domain([0, maxCases])
		.range([height, 0])
		.exponent(exp).nice();

	propertyNames = ["cases", "deaths"]
	propertyMaxes = [maxCases, maxDeaths]

	// var colors = d3.schemeCategory10;
	var colors = ["red", "blue"]

	plotVariable("cases", colors[0])
	plotVariable("deaths", colors[1])

	var xAxisGroup = chart
		.append('g')
		.attr("class", "xAxisGroup")
		.attr("transform", "translate(0, " + height + ")")

	var xAxis = d3.axisBottom(x)
		.tickFormat(d3.timeFormat("%Y-%m-%d"));

	var yAxisGroup = chart
		.append('g')
		.attr("class", "yAxisGroup");

	var yAxis = d3.axisLeft(y)
		.ticks(10);

	yAxis(yAxisGroup);
	xAxis(xAxisGroup);
	drawGridlines();

	circlePoints(propertyNames, chart, data);

	drawLegend(propertyNames, chart, propertyMaxes, entity);

	d3.selectAll(".xAxisGroup .tick text")
		.attr("transform", "rotate(-15)")

	chart.append("text")
		.attr("x", (width / 2))
		.attr("y", -15)
		.attr("text-anchor", "middle")
		.style("font-size", "24px")
		.style("text-decoration", "none")
		.text(entity + " County COVID-19 Cases");

	d3.select("#chart")
		.append("div")
		.attr("id", "data-source")
		.attr("target", "_")
		.style("font-size", "12px")
		.style("color", "black")
		.html("Data Source: <a id='source' href='https://github.com/nytimes/covid-19-data'>https://github.com/nytimes/covid-19-data</a>")

	function circlePoints(propertyNames, dataGroup, data) {

		let transitionTime = 300;

		chartTooltipDiv = d3.select('#chart').append('div')
			.attr('class', 'tooltip chartTip')
			.style('opacity', 0);

		let coords = document.getElementById('chart')
			.getBoundingClientRect()

		let xOrg = coords["x"]
		let yOrg = coords["y"]

		for (var i = 0; i < propertyNames.length; i++) {


			let propertyName = propertyNames[i]

			data.forEach((point) => {

				let date
				let cases
				let deaths
				let xpos
				let ypos
				let newDate

				let color = colors[i]

				let circle = dataGroup.append("circle")
					.attr("fill", color)
					.attr("r", 2)
					.attr("cx", x(point.date))
					.attr("cy", y(point[propertyName]))

				circle.on('mouseover', () => {
					color = circle.attr("fill")
					circle.transition().ease(d3.easeCubicOut).duration(transitionTime)
						.attr("r", 10)
						.attr("fill", "darkgray")


					date = point.date.toString().split(" ")
					newDate = date[1] + ' ' + date[2] + ', ' + date[3]
					cases = point.cases
					deaths = point.deaths
					xpos = x(point.date)
					ypos = y(point[propertyName])

					let x0 = x(data[0].date)

					chartTooltipDiv.transition().duration(transitionTime).style('opacity', 1)
					chartTooltipDiv
						.html(`
						<strong class="">${newDate}</strong><br/>
						<span>Cases: ${cases}</span><br/>
						<span>Deaths: ${deaths}</span><br/>
					`)
						.style('left', xOrg + xpos - 10 + 'px')
						.style('top', yOrg + ypos + 20 + 'px')
						// .style('left', '20px')
						// .style('top', '600px')
				})

				circle.on('mouseout', () => {
						chartTooltipDiv.transition().duration(transitionTime).style('opacity', 0)
						circle.transition().ease(d3.easeCubicOut).duration(200).attr("r", 2)
							.attr("fill", color)


					})
					.append("title")
					.text("Date: " + d3.timeFormat("%Y-%m-%d")(point.date) + "\n" + propertyNames[i] + ": " + point[propertyNames[i]])
			})
		}
	}


	function drawGridlines() {

		var yGridlines = d3.axisLeft(y)
			.ticks(30)
			.tickFormat("")
			.tickSize(-width)

		var gridy = chart.append("g")
			.attr("class", "grid")
			.call(yGridlines);

		yGridlines(gridy);

		// uncomment the next 3 blocks to show xAxis gridlines

		// var xGridlines = d3.axisBottom(x)
		// 	.ticks(numOfDataPoints)
		// 	.tickFormat("")
		// 	.tickSize(height)

		// var gridx = chart.append("g")
		// 	.attr("class", "grid")
		// 	.call(xGridlines);

		// xGridlines(gridx);
	}


	function plotVariable(propertyName, color) {

		var line2 = d3.line()
			.x(d => x(d.date))
			.y(d => y(d[propertyName]))
			.curve(d3.curveMonotoneX)
			// .curve(d3.curveStepAfter)
			// .curve(d3.curveLinear)

		chart.append("path")
			.data([data])
			.attr("fill", "none")
			.attr("stroke", color)
			.attr("d", line2)
			.attr("stroke-width", "1.5")
	}


	function drawLegend(propertyNames, chart, max, county) {
		d3.csv("/static/data/population_data/cases_per_capita.csv" + '?' + Math.floor(Math.random() * 100)).then(function(d) {
			// d3.csv("/static/data/population_data/population_data.csv").then(function(d){

			let pop;
			let casesPer;

			d.forEach(function(row) {
				if (row.county == county) {
					pop = row.population
					casesPer = parseFloat(row.cases_per_capita).toFixed(0)
				}
			})

			let legendElements = [];

			let legend = chart
				.append("g")

			let elementHeight = 4;

			let xMargin = 5;
			let yMargin = 5;
			let xOrigin = 40;
			let yOrigin = 20;
			let boxMargin = 8
			let width = 140 + boxMargin * 2;
			let height = 40;

			let elementWidth = 40;

			legend
				.append("rect")
				.attr("x", xOrigin)
				.attr("y", yOrigin)
				.attr("id", "legend-box")
				// .attr("stroke", "black")
				.attr("radius", "5")
				// .attr("fill", "grey")
				.attr("fill", "white")
				.attr("width", width)
				.attr("height", height)
				.attr("rx", 5)
				.attr("opacity", .1)


			for (let i = 0; i < propertyNames.length; i++) {
				let element = {
					color: colors[i],
					title: propertyNames[i],
					max: max[i]

				}
				legendElements.push(element)
			}

			currentY = yOrigin + yMargin;

			legendElements.forEach(function(x) {

				legend.append("rect")
					.attr("fill", x.color)
					.attr("x", xOrigin + xMargin + 8)
					.attr("y", currentY + boxMargin)
					.attr("width", elementWidth)
					.attr("height", elementHeight)
					.append("title")
					.text(x.title)

				let title = capitalize(x.title) + ":   " + numberWithCommas(x.max)

				console.log(title)

				legend.append("text")
					.text(title)
					.attr("font-size", "10pt")
					.attr("fill", "black")
					.attr("x", elementWidth + xMargin + 10)
					.attr("y", currentY + boxMargin)
					.attr("dx", elementWidth + xMargin + 8)
					.attr("dy", yMargin)

				currentY += elementHeight + 10

			});

			if (pop) {
				pop = parseFloat(pop.split(",").join(""));
			}

			if (pop >= 1000000) {
				pop = (pop / 1000000).toFixed(1)
				pop = pop.toString() + " million"
			} else {
				pop = numberWithCommas(pop);
			}

			legend.append("text")
				.text("Population: " + pop)
				.attr("font-size", "10pt")
				.attr("fill", "black")
				.attr("x", 0)
				.attr("y", boxMargin + 60)
				.attr("dx", elementWidth + xMargin + 8)
				.attr("dy", yMargin)

			legend.append("text")
				.text("Cases per 100k: " + casesPer)
				.attr("font-size", "10pt")
				.attr("fill", "black")
				.attr("x", 0)
				.attr("y", boxMargin + 60 + 20)
				.attr("dx", elementWidth + xMargin + 8)
				.attr("dy", yMargin)
		})
	}


	function capitalize(s) {
		if (typeof s !== 'string') return ''
		return s.charAt(0).toUpperCase() + s.slice(1)
	}

}

function snake_it(name) {
	return name.toLowerCase().split(" ").join("_")
}

function numberWithCommas(number) {
	return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}