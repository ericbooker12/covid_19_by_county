$(document).ready(function() {
    let url = "./static/county_data/all_counties.csv"

    Promise.all([
            d3.json('./static/topodata/cal_counties.topo.json'), //topoData
            d3.csv('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv'), //covidData
            // d3.csv(url), //covidData
            d3.csv('./static/data/population_data/population_data.csv') //populationData
        ]).then(([topoData, covidData, populationData]) => {
            //Discountinue use of californiaData

            covidData = covidData.filter(d => {
                return (
                    d.state == "California"
                );
            });

            let tempPopulationData = populationData;

            covidData.forEach(function(i) {
                populationData.forEach(function(j) {
                    let popCounty = j.county;
                    if (j.county == i.county) {
                        i.population = removeCommas(j.population)
                        i.cases_per_capita = Math.round(parseInt(i.cases) * 100000 / i.population)
                    }
                })
            })

            // console.log(covidData)


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
            let countyMap = new D3Map(topoData, covidData)
            let countyGroup = countyMap.drawCounties(colorScheme)

            countyMap.colorCounties(countyGroup, colorScheme)
            countyMap.drawLegend(colorScheme)

        })
        .catch((err) => console.error('Error retrieving data:', err))
})

class Tooltip {
    constructor(svgX, svgY, data) {
        this.data = data
        this.svgX = svgX
        this.svgY = svgY
            // this.perCapita = perCapitaData

        // console.log(this.perCapita)

        this.div = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
    }

    showStats(x, y, county) {

        // this.remove()

        let currentCounty = county.properties.name
            // console.log(currentCounty)
            // console.log(this.data)

        let countyData = this.data.filter(data => {
            return (
                data.county == currentCounty
            );
        });

        countyData = getNewCasesAndDeaths(countyData)

        let countyName;
        let cases;
        let newCases;
        let deaths;
        let newDeaths;
        let population;
        let perCapita;

        this.data.forEach((d) => {
            if (d.county == county.properties.name) {
                countyName = d.county
                cases = d.cases
                newCases = d.new_cases
                deaths = d.deaths
                newDeaths = d.new_deaths
                population = d.population
                perCapita = d.cases_per_capita
            }
        })

        let currentPerCapita = (newCases / population * 100000).toFixed(1);

        if (isNaN(cases)) {
            cases = 0
        }

        // this.perCapita.forEach(function(x) {
        //     if (x.county == countyName) {
        //         perCapita = x.cases_per_capita
        //     }
        // })

        this.div.transition().duration(100).style('opacity', 1)


        //Map tooltip.
        this.div
            .html(function() {
                if (countyName) {
                    return (`
                        <strong class='title'>${countyName} County</strong><br/>
                        <span>Cases: ${numberWithCommas(cases)}</span><br/>
                        <span>New Cases: ${(newCases)}</span><br/>
                        <span>Deaths: ${deaths}</span><br/>
                        <span>New Deaths: ${(newDeaths)}</span><br/>
                        <span>Population: ${population > 0 ? numberWithCommas(population) : population}</span><br/>
                        <span>Total Cases per 100k: ${perCapita ? perCapita : 0 }</span><br/>
                        <span>New Cases per 100k: ${currentPerCapita}</span><br/>`)
                } else {
                    return (`
                        <strong class = 'title' > ${county.properties.namelsad}</strong><br/ >
                        <span>No Cases Reported</span><br/>`)
                }
            })
            .style('left', '20px')
            .style('top', '500px')
    }

    showChartStats(x, y, county) {

        let date = county.date
        let cases = county.cases
        let deaths = county.deaths

        this.div.transition().duration(200).style('opacity', 1)

        this.div.html(`
            <strong>${date} County</strong><br/>
            <span>Cases: ${cases}</span><br/>
            <span>XXXDeaths: XXX${deaths}</span><br/>
        `)
            .style('left', '20px')
            .style('top', '600px')
    }

    remove() {
        this.div.transition().duration(200).style('opacity', 0)
    }

}

class D3Map {
    constructor(topoData, covidData) {

        // covid data is the same as coviddata2 but has population data
        // console.log('covidData', covidData)
        // console.log('covidData2', covidData2)


        // this.covidData2 = covidData2;

        this.covidData = covidData;


        // Get population data from perCapita

        this.svg = d3.select('.sidebar')
            .append('svg')
            .attr('id', 'map')
            .attr('height', 600)
            .attr('width', 400)

        let { height, width, x, y } = document.getElementById('map')
            .getBoundingClientRect()

        const geojson = topojson.feature(topoData, topoData.objects['california_counties'])


        this.counties = geojson.features
            // this.projection = d3.geoAlbers() //set rotate to -30
        this.projection = d3.geoMercator()
        this.projection
            .fitExtent([
                [0, 0],
                [width - 50, height - 50]
            ], geojson)

        // console.log(perCapita)

        const { min, max, minCounty, maxCounty } = getCasesPerCapitaRange(covidData)


        this.min = min
        this.max = max
        this.minCounty = minCounty
        this.maxCounty = maxCounty

        let currentDate = covidData[covidData.length - 1].date;

        this.tooltip = new Tooltip(x, y, covidData)

    }

    drawCounties(colorScheme) {
        const path = d3.geoPath().projection(this.projection)
        let tempData = this.covidData

        const scale = getScale(this.min, this.max, colorScheme)
            // let casesPerCapita = this.perCapita

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
            .attr('id', d => { return snake_it(d.properties.name) })
            .attr('class', "county")
            .attr('stroke', 'lightgray')
            .attr("transform", "translate(20, 0) rotate(0) scale(1)")
            .on('click', (d, i, counties) => {
                let countyName = d.properties.name

                const [x, y] = path.centroid(d)
                this.tooltip.showStats(x, y, d)

                this.showData(d, i, counties)

            })
            .on('mouseover', (d, i, counties) => {
                d3.select(counties[i]).transition().duration(300)
                    .attr('fill', 'lightblue')
                    .attr('class', 'shadow')
                    .attr('opacity', 1);

                let [x, y] = path.centroid(d)
                this.tooltip.showStats(x, y, d)
            })
            .on('mouseout', (d, i, counties) => {
                d3.select(counties[i]).transition().duration(100)
                    .attr('stroke', 'lightgray')
                    .attr('fill', function(county) {
                        let countyName = county.properties.name;
                        let cases;

                        tempData.forEach(function(c) {
                            if (c.county == countyName) {
                                cases = c.cases_per_capita
                            }
                        })

                        if (!cases) {
                            cases = 0
                        }

                        return scale(cases)
                    })
            })

        function labels(svg, x, y, name) {
            let joinedName = joinCountyName(name)
        }
        return countyGroup
    }

    colorCounties(countyGroup, colorScheme) {
        const scale = getScale(this.min, this.max, colorScheme)

        // console.log(countyGroup)

        // let casesPerCapita = this.perCapita;
        let tempData = this.covidData

        countyGroup
            .attr('fill', function(county) {
                let countyName = county.properties.name;
                let cases;

                // console.log(county)

                // casesPerCapita.forEach(function(c) {
                //     if (c.county == countyName) {
                //         cases = c.cases_per_capita
                //     }
                // })

                tempData.forEach(function(c) {
                    if (c.county == countyName) {
                        cases = c.cases_per_capita
                    }
                })

                if (!cases) {
                    cases = 0
                }

                return scale(cases)
            })
            .attr('opacity', '.8')
    }

    showData(entity, i, counties, covidData) {


        let countyName = entity.properties.name
        let countyData = this.covidData.filter(data => {
            return (
                data.county == countyName
            );
        });

        countyData = getNewCasesAndDeaths(countyData);

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
            // data: $(this).text(),
            data: "Hello from showData",
            type: 'POST',
            url: '/' + countyName
        })
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
        let gradient = this.svg
            .append('defs').append('svg:linearGradient')
            .attr('id', 'gradient')
            .attr('x1', '100%')
            .attr('x2', '100%')
            .attr('y1', '0%')
            .attr('y2', '100%')
            .attr('spreadMethod', 'pad')

        let lowColor = colorScheme(0)
        let highColor = colorScheme(1)

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', highColor)
            .attr('stop-opacity', 1)

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', lowColor)
            .attr('stop-opacity', 1)

        let w = 60
        let h = 240

        let legend = this.svg.append('g')
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

        let axisScale = d3.scaleLinear()
            .range([h, 0])
            .domain([0, this.max])

        let axis = d3.axisLeft(axisScale)
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
    let minCounty = "";
    let maxCounty = "";

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

    return { min, max, minCounty, maxCounty }
}

function renderChart(value) {

    let county = $("#render_scale").attr("class");


    county_joined = county.toLowerCase().split(' ').join('_')

    let source = "csv"

    d3.csv("/static/county_data/" + county_joined + ".csv" + '?' + Math.floor(Math.random() * 100))
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

    let parseTime = d3.timeParse("%Y-%m-%d");
    data.forEach(function(d) {
        if (typeof d.date == 'string') {
            d.date = parseTime(d.date);
        }
    });

    // let margin = 80;
    let marginTop = 60;
    let marginBottom = 40;
    let marginLeft = 40;
    let marginRight = 20;
    let width = 600;
    let height = 400;

    let chart = d3.select("#chart").append("svg")
        .attr("class", "chart-svg")
        .attr("width", width + marginLeft + marginRight)
        .attr("height", height + marginBottom + marginTop)
        .append('g')
        .attr("transform", "translate(" + marginLeft + ", " + marginTop + ")");

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
        // plotVariable("new_cases", colors[1])
        // new_cases

    var xAxisGroup = chart
        .append('g')
        .attr("class", "xAxisGroup")
        .attr("transform", "translate(0, " + height + ")")

    var xAxis = d3.axisBottom(x)
        .tickFormat(d3.timeFormat("%b %d"));

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



        chartTooltipDiv = d3.select('#chart')
            .append('div')
            .attr('class', 'tooltip chartTip')
            .style('opacity', 0);

        let coords = document.getElementById('chart')
            .getBoundingClientRect()

        let xOrg = coords["x"]
        let yOrg = coords["y"]

        for (var i = 0; i < propertyNames.length; i++) {

            let propertyName = propertyNames[i];

            data.forEach((point) => {

                // let date;
                // let cases;
                // let deaths;
                // let xpos;
                // let ypos;
                // let newDate;
                // let newCases;

                let color = colors[i];

                let circle = dataGroup.append("circle")
                    .attr("fill", color)
                    .attr("r", 5)
                    .attr("cx", x(point.date))
                    .attr("cy", y(point[propertyName]))
                    .attr('opacity', 0);

                let transitionTime = 300;

                circle.on('mouseover', () => {
                    color = circle.attr("fill")
                    circle.transition().ease(d3.easeCubicOut).duration(transitionTime)
                        .attr("r", 8)
                        .attr("fill", "darkgray")
                        .attr('opacity', 1)


                    let date = point.date.toString().split(" ");
                    let newDate = date[1] + ' ' + date[2] + ', ' + date[3];
                    let cases = point.cases;
                    let newCases = point.new_cases;
                    let newDeaths = point.new_deaths;
                    let deaths = point.deaths;
                    let xpos = x(point.date);
                    let ypos = y(point[propertyName]);


                    let x0 = x(data[0].date);

                    chartTooltipDiv
                        .transition().duration(transitionTime)
                        .style('opacity', .8)

                    chartTooltipDiv
                        .html(`
						<strong class="">${newDate}</strong><br/>
                        <span>Total Cases: ${numberWithCommas(cases)}</span><br/>
                        <span>New Cases: ${numberWithCommas(newCases)}</span><br/>
                        <span>Deaths: ${numberWithCommas(deaths)}</span><br/>
                        <span>New Deaths: ${numberWithCommas(Math.round(newDeaths))}</span><br/>
					`)
                        .style('left', xOrg + xpos - 70 + 'px')
                        .style('top', yOrg + ypos + 30 + 'px')
                })

                circle.on('mouseout', () => {
                    chartTooltipDiv.transition().duration(transitionTime).style('opacity', 0)
                    circle.transition()
                        .ease(d3.easeCubicOut).duration(200)
                        .attr("r", 4)
                        .attr("fill", color)
                        .attr('opacity', 0);
                })
            })
        }
    }


    function drawGridlines() {

        var yGridlines = d3.axisLeft(y)
            .ticks(30)
            .tickFormat("")
            .tickSize(-width)

        var gridY = chart.append("g")
            .attr("class", "grid")
            .call(yGridlines);

        yGridlines(gridY);

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

        var line = d3.line()
            .x(d => x(d.date))
            .y(d => y(d[propertyName]))
            .curve(d3.curveMonotoneX)
            // .curve(d3.curveStepAfter)
            // .curve(d3.curveLinear)

        chart.append("path")
            .data([data])
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("d", line)
            .attr("stroke-width", "2")
    }


    function drawLegend(propertyNames, chart, max, county) {

        let legend = chart.append("g")
        let elementHeight = 4;
        let elementWidth = 40;
        let xMargin = 5;
        let yMargin = 5;
        let xOrigin = 40;
        let yOrigin = 40;
        let boxMargin = 8
        let width = 140 + boxMargin * 2;
        let height = 40;
        let legendElements = [];

        // max[0] is number of cases, only attempt to draw chart if cases exist
        if (max[0]) {
            d3.csv("/static/data/population_data/cases_per_capita.csv" + '?' + Math.floor(Math.random() * 100))
                .then(function(d) {
                    // d3.csv("/static/data/population_data/population_data.csv").then(function(d){

                    let numOfData = inputData.length;
                    let endDate = inputData[numOfData - 1].date;
                    let latestNewCases = inputData[numOfData - 1].new_cases;
                    let latestNewDeaths = inputData[numOfData - 1].new_deaths;
                    let pop;
                    let casesPer;

                    var formatTime = d3.timeFormat("%B %d, %Y");
                    endDate = formatTime(endDate); // "June 30, 2015"

                    d.forEach(function(row) {
                        if (row.county == county) {
                            pop = row.population
                            casesPer = parseFloat(row.cases_per_capita).toFixed(0)
                        }
                    })

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
                        .attr("opacity", .1);


                    for (let i = 0; i < propertyNames.length; i++) {
                        let element = {
                            color: colors[i],
                            propertyName: propertyNames[i],
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
                            .text(x.propertyName);

                        let propertyName = capitalize(x.propertyName) + ":   " + numberWithCommas(x.max);

                        legend.append("text")
                            .text(endDate)
                            // .attr("font-weight", "bold")
                            .attr("font-size", "12pt")
                            .attr("fill", "black")
                            .attr("x", 0)
                            .attr("y", boxMargin + 22)
                            .attr("dx", elementWidth + xMargin + 8)
                            .attr("dy", yMargin);

                        legend.append("text")
                            .text(propertyName)
                            .attr("font-size", "10pt")
                            .attr("fill", "black")
                            .attr("x", elementWidth + xMargin + 10)
                            .attr("y", currentY + boxMargin)
                            .attr("dx", elementWidth + xMargin + 8)
                            .attr("dy", yMargin);

                        currentY += elementHeight + 10;
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
                        .text("New cases: " + latestNewCases)
                        .attr("font-size", "10pt")
                        .attr("fill", "black")
                        .attr("x", 0)
                        .attr("y", boxMargin + 80)
                        .attr("dx", elementWidth + xMargin + 8)
                        .attr("dy", yMargin)

                    legend.append("text")
                        .text("New deaths: " + latestNewDeaths)
                        .attr("font-size", "10pt")
                        .attr("fill", "black")
                        .attr("x", 0)
                        .attr("y", boxMargin + 80 + 20)
                        .attr("dx", elementWidth + xMargin + 8)
                        .attr("dy", yMargin)

                    legend.append("text")
                        .text("Population: " + pop)
                        .attr("font-size", "10pt")
                        .attr("fill", "black")
                        .attr("x", 0)
                        .attr("y", boxMargin + 80 + 20 + 20)
                        .attr("dx", elementWidth + xMargin + 8)
                        .attr("dy", yMargin)

                    legend.append("text")
                        .text("Cases per 100k: " + casesPer)
                        .attr("font-size", "10pt")
                        .attr("fill", "black")
                        .attr("x", 0)
                        .attr("y", boxMargin + 80 + 40 + 20)
                        .attr("dx", elementWidth + xMargin + 8)
                        .attr("dy", yMargin)
                })
        } else {
            legend.append("text")
                .text(`No reported cases for ${county} County`)
                // .attr("font-weight", "bold")
                .attr("font-size", "16pt")
                .attr("fill", "black")
                .attr("x", xOrigin + 70)
                .attr("y", 200)
        }
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

function getNewCasesAndDeaths(countyData) {

    let previousCaseCount = 0;
    let previousDeathCount = 0;
    // let currentDeathCount = 0;
    let newCases = 0;
    let newDeaths = 0;

    countyData.forEach(c => {
        let currentCaseCount = c.cases;
        let currentDeathCount = c.deaths;

        newCases = currentCaseCount - previousCaseCount;
        newDeaths = currentDeathCount - previousDeathCount;

        previousCaseCount = currentCaseCount;
        previousDeathCount = currentDeathCount;

        c.new_deaths = newDeaths;
        c.new_cases = newCases;
    })

    return countyData;
}

function getNewDeaths(countyData) {

    // let previousCaseCount = 0;
    let previousDeathCount = 0;
    // let currentDeathCount = 0;
    // let newCases = 0;
    let newDeaths = 0;

    countyData.forEach(c => {
        // let currentCaseCount = c.cases;
        let currentDeathCount = c.deaths;

        // newCases = currentCaseCount - previousCaseCount;
        newDeaths = currentDeathCount - previousDeathCount;

        // previousCaseCount = currentCaseCount;
        previousDeathCount = currentDeathCount;

        c.new_deaths = newDeaths;
        // c.new_cases = newCases;
    })

    return countyData;
}

function removeCommas(str) {
    let num = str.split(',').join('');
    num = parseInt(num);
    return num;
}