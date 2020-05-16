$( document ).ready(function() {

	$('.countyForm').on('click', function(event){
		event.preventDefault();


		let county = $(this).text()
		console.log(county)

		$("#countyBtn").removeClass()
		$("#countyBtn").addClass(county);
		$("#render_scale").removeClass()
		$("#render_scale").addClass(county);

		$.ajax({
			data: $(this).text(),
			type: 'POST',
			url: '/' + county
		})
		.done(function(response){
			makeData(response, "ajax", .5, county)
		});
	});

	$('#countyBtn').on('click', function(event){
		event.preventDefault();

		var county = $(this).attr("class");

		county = county.toLowerCase().split(' ').join('_')

		d3.csv("/static/data/" + county + ".csv")
			.then(function(data) {

				makeData(data, 'csv', .5, county)
			});

	});

})


	function renderChart(value){
		let county = $("#render_scale").attr("class");
		county_joined = county.toLowerCase().split(' ').join('_')

		let source = "csv"

		d3.csv("/static/data/" + county_joined + ".csv")
			.then(function(data) {
				makeData(data, 'csv', value, county)
			});
		}

	function getData(data, type){
		csvJSON(data)
	}

	function makeData(inputData, source, exp, entity){

		$("#range-value").html(`Y-scale = <span id='range-value-bold'>y^` + exp + `</span>`);
		$("#slider-table").removeAttr('hidden');

		d3.select(".chart-svg").remove();

		var data = {};

		if (source == "ajax"){
			data = inputData
			data = JSON.parse(data);
			// console.log("ajax", data[data.length - 1])
		}

		if (source == "csv"){
			data = inputData

			for (var i = 0; i < data.length; i++){
				for (var item in data[i]) {
					if(item == 'cases' || item == 'deaths' || item == 'new_cases'){
						data[i][item] = parseInt(data[i][item])
					}
				}
			}
		}

		var margin = 50;
		var width = 600;
		var height = 500;

		var chart = d3.select("#chart").append("svg")
			.attr("class", "chart-svg" )
			.attr("width", width + 2 * margin)
			.attr("height", height + 2 * margin)
			.append('g')
			.attr("transform", "translate(" + margin + ", " + margin + ")");

		var parseTime = d3.timeParse("%Y-%m-%d");

		data.forEach(function (d){
			d.date = parseTime(d.date);
		});

		var x = d3.scaleTime()
			.domain(d3.extent(data, function(d) {return d.date; })) //returns min and max
			.range([0, width]);

		var maxCases = d3.max(data, function(d) {return d.cases})
		var maxDeaths = d3.max(data, function(d) {return d.deaths})
		var minCases = d3.min(data, function(d) {return d.cases})

		var y  = d3.scalePow()
			.domain([0, maxCases])
			.range([height, 0])
			.exponent(exp).nice();

		propertyNames = ["cases", "deaths"]
		propertyMaxes = [maxCases, maxDeaths]

		// var colors = d3.schemeCategory10;
		var colors = ["red", "blue"]


		// for (var i = 0; i < propertyNames.length; i++) {
		// 	plotVariable(propertyNames[i], d3.schemeCategory10[i])
		// }

		plotVariable("cases", colors[0])
		plotVariable("deaths", colors[1])

		var xAxisGroup = chart
			.append('g')
			.attr("class", "xAxisGroup")
			.attr("transform", "translate(0, " + height + ")" )

		var xAxis = d3.axisBottom(x)
			.tickFormat(d3.timeFormat("%Y-%m-%d"));

		var yAxisGroup = chart
			.append('g')
			.attr("class", "yAxisGroup");

		var yAxis = d3.axisLeft(y)
			.ticks(20);

		yAxis(yAxisGroup);
		xAxis(xAxisGroup);
		drawGridlines();
		circlePoints(propertyNames, chart);

		drawLegend(propertyNames, chart, propertyMaxes, entity);

		d3.selectAll(".xAxisGroup .tick text")
			.attr("transform", "rotate(-15)")

		chart.append("text")
				.attr("x", (width / 2))
				.attr("y",  -15)
				.attr("text-anchor", "middle")
				.style("font-size", "24px")
				.style("text-de`coration", "underline")
				.text(entity + " County COVID-19 Cases");


		function circlePoints(propertyNames, dataGroup){

			for (var i = 0; i < propertyNames.length; i++) {
				data.forEach(function(point) {
					dataGroup.append("circle")
						.attr("fill", colors[i])
						.attr("r", 2)
						.attr("cx", x(point.date))
						.attr("cy", y(point[propertyNames[i]]))
						.append("title")
						.text("Date: " + d3.timeFormat("%Y-%m-%d")(point.date) + "\n" + propertyNames[i] + ": " + point[propertyNames[i]]);
				})
			}
		}


		function drawGridlines() {

			var yGridlines = d3.axisLeft(y)
				.ticks(30)
				.tickFormat("")
				.tickSize(-width)
				// .attr("fill", "grey")

			var gridy = chart.append("g")
				.attr("class", "grid")
				.call(yGridlines);

			yGridlines(gridy);

			var xGridlines = d3.axisBottom(x)
				.ticks(30)
				.tickFormat("")
				.tickSize(height)

			var gridx = chart.append("g")
				.attr("class", "grid")
				.call(xGridlines);

			xGridlines(gridx);
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
			d3.csv("/static/data/p.csv" +'?' + Math.floor(Math.random() * 1000)).then(function(d){

				let pop;

				d.forEach(function(row){
					if( row.county == county){
						pop = row.population
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

				// let height = propertyNames.length * elementHeight * 6+ (2 * yMargin);
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


				for (var i = 0; i < propertyNames.length; i++) {
					var element =
						{
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

					let title = capitalize(x.title) + ":   " + x.max

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

				// console.log("pop", typeof parseFloat(pop))

				if (pop){
					pop = parseFloat(pop.split(",").join(""));
				}

				if (pop >= 1000000) {
					pop = (pop / 1000000).toFixed(1)
					pop = pop.toString() + " million"
				} else {
					pop =  pop.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				}

				legend.append("text")
					.text("Population: " + pop)
					.attr("font-size", "10pt")
					.attr("fill", "black")
					.attr("x", 0)
					.attr("y", boxMargin + 60)
					.attr("dx", elementWidth + xMargin + 8)
					.attr("dy", yMargin)
			})
		}


		function capitalize(s) {
			if (typeof s !== 'string') return ''
			return s.charAt(0).toUpperCase() + s.slice(1)
		}

	}




















