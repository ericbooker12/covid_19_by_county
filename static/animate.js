let urlCurrentAnimate = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv"
let urlArchiveAnimate = "data/us_data.csv"

let colors = {
    smoky: "#210f04",
    seal: "#452103",
    blood: "#690500",
    saddle: "#934b00",
    liver: "#bb6b00"
}

let colors2 = [
    "#03071e",
    "#370617",
    "#6a040f",
    "#9d0208",
    "#d00000",
    "#dc2f02",
    "#e85d04",
    "#f48c06",
    "#faa307",
    "#ffba08"
]


Promise.all([
    d3.json('./static/topodata/cal_counties.topo.json'),
    d3.csv(urlCurrentAnimate, type)
]).then(([topoData, covidData]) => {

    covidData = covidData.filter(d => {
        return (
            d.state == "California"
        );
    })



    let mapParams = document.getElementById('bubbles')
        .getBoundingClientRect();

    let mapHeight = mapParams.height;
    let mapWidth = mapParams.width;

    const geojson = topojson.feature(topoData, topoData.objects['california_counties']);

    let counties = geojson.features;

    let projection = d3.geoMercator();
    projection
        .fitExtent([
            [0, 25],
            [mapWidth, mapHeight - 50]
        ], geojson)

    let path = d3.geoPath().projection(projection);

    counties.forEach(function(d) {
        let cent = path.centroid(d)
        d.x = cent[0]
        d.y = cent[1]
    });

    covidData.forEach(function(row) {
        console.log(row)
    })



    let dates = [];
    let parsedDates = [];

    covidData.forEach((row) => {
        if (!dates.includes(row.date))
            dates.push(row.date)
    })

    const parseDate = string => d3.timeParse('%Y-%m-%d')(string)
    dates.forEach(d => {
        const date = parseDate(d);
        parsedDates.push(date)
    })

    let map_svg = d3.select('.animated-map-container')
        .append('svg')
        .attr('id', 'california_map')

    let idx = 0;

    drawMap(path, counties, map_svg, mapHeight, mapWidth)

    let tempDate = dates[20];

    let refreshRate = 750;


    let dateIndex = 20;
    let numOfRecords = dates.length;
    let currentIdx;

    let pauseBtn = d3.select("#pause-btn");
    let resetBtn = d3.select("#reset-btn");
    let skipAhead5Btn = d3.select("#skip-ahead-5-btn");
    let skipBack5Btn = d3.select("#skip-back-5-btn");
    let skipAhead1Btn = d3.select("#skip-ahead-1-btn");
    let skipBack1Btn = d3.select("#skip-back-1-btn");
    let skipToLastBtn = d3.select("#skip-to-last-btn");

    function startInterval() {

        drawDots(covidData, path, counties, dates, map_svg, mapHeight, mapWidth, dateIndex);
        idx += 1;
        dateIndex += 1;

        if (dateIndex == numOfRecords) {
            clearInterval(interval);
        }
    }

    let interval = setInterval(function() {
        startInterval()
    }, refreshRate);

    pauseBtn.on("click", function() {
        console.log("Pause")

        if (pauseBtn.attr("class") == "pause") {
            currentIdx = dateIndex;
            pause(currentIdx)

        } else if (pauseBtn.attr("class") == "start") {
            start(currentIdx)
        }

    });

    resetBtn.on("click", function() {
        console.log("reset")
        dateIndex = 0;
        pause(dateIndex)
        start(dateIndex)

    });

    skipAhead5Btn.on("click", function() {
        pause(idx)
        dateIndex += 5;
        if (dateIndex >= dates.length - 1) {
            dateIndex = dates.length - 1
        }


        drawDots(covidData, path, counties, dates, map_svg, mapHeight, mapWidth, dateIndex);

    });

    skipBack5Btn.on("click", function() {
        pause(dateIndex)
        dateIndex -= 5;
        if (dateIndex < 0) {
            dateIndex = 0
        }

        drawDots(covidData, path, counties, dates, map_svg, mapHeight, mapWidth, dateIndex);

    });

    skipAhead1Btn.on("click", function() {
        pause(dateIndex)
        dateIndex += 1;
        if (dateIndex >= dates.length - 1) {
            dateIndex = dates.length - 1
        }


        drawDots(covidData, path, counties, dates, map_svg, mapHeight, mapWidth, dateIndex);

    });

    skipBack1Btn.on("click", function() {
        pause(dateIndex)
        dateIndex -= 1;
        if (dateIndex < 0) {
            dateIndex = 0
        }

        drawDots(covidData, path, counties, dates, map_svg, mapHeight, mapWidth, dateIndex);

    });

    skipToLastBtn.on("click", function() {
        pause(dateIndex)
        dateIndex = dates.length - 1;

        drawDots(covidData, path, counties, dates, map_svg, mapHeight, mapWidth, dateIndex);

    });

    function pause(currentIdx) {
        clearInterval(interval);
        pauseBtn.html("Resume")
        pauseBtn.attr("class", "start")
    }

    function start(currentIdx) {
        pauseBtn.html("Pause")
        pauseBtn.attr("class", "pause")

        interval = setInterval(function() {
            startInterval()
        }, refreshRate)
    }

});


function drawDots(covidData, path, counties, dates, map_svg, height, width, dateIndex) {

    const dur = 800;
    const t = d3.transition().duration(dur)
    let tempDate = dates[dateIndex]

    d3.selectAll('.circle').remove()

    let points = map_svg
        .append('g')
        .selectAll('circle')
        .data(counties)
        .join(
            enter => {
                enter
                    .append('circle')
                    .attr('opacity', .7)
                    .attr('class', 'circle')
                    .attr('cx', (d) => { return d.x })
                    .attr('cy', (d) => { return d.y })
                    .attr('r', (d) => {

                        let countyName = d.properties.name;
                        let day = filterData(tempDate, countyName)
                        let cases = 0;
                        if (day[0]) {
                            cases = day[0].cases
                        }

                        let radius = Math.sqrt(cases)

                        if (cases >= 2000) {
                            radius = Math.sqrt(2000)
                        }

                        return radius;
                    })
                    .attr('fill', (d) => {
                        let countyName = d.properties.name;
                        let day = filterData(tempDate, countyName)

                        if (day[0] && day[0].cases >= 12500) {
                            return "red"
                        } else if (day[0] && day[0].cases >= 10000) {
                            return colors2[4]
                        } else if (day[0] && day[0].cases >= 7500) {
                            return colors2[5]
                        } else if (day[0] && day[0].cases >= 5000) {
                            return colors2[6]
                        } else if (day[0] && day[0].cases >= 2000) {
                            return colors2[7]
                        } else
                            return '#2090b3'
                    })

            },
            update => {
                update
                    .transition(t)
                    .delay((d, i) => i * 20)
                    .attr('cx', (d) => d.x)
                    .attr('cy', (d) => d.y)
                    .attr('r', (d) => {
                        console.log(d)
                        let countyName = d.properties.name;
                        let day = filterData(tempDate, countyName)
                        let cases = 0;
                        if (day[0]) {
                            cases = day[0].cases
                        }

                        let radius = Math.sqrt(cases)

                        if (cases >= 2000) {
                            radius = Math.sqrt(2000)
                        }

                        return radius;
                    })
                    .attr('fill', (d) => {
                        let countyName = d.properties.name;
                        let day = filterData(tempDate, countyName)

                        if (day[0] && day[0].cases >= 12500) {
                            return "red"
                        } else if (day[0] && day[0].cases >= 10000) {
                            return colors2[4]
                        } else if (day[0] && day[0].cases >= 7500) {
                            return colors2[5]
                        } else if (day[0] && day[0].cases >= 5000) {
                            return colors2[6]
                        } else if (day[0] && day[0].cases >= 2000) {
                            return colors2[7]
                        } else
                            return '#2090b3'
                    })
            }
        )


    d3.selectAll('.cases-text').remove()

    let content = d3.select('.animated-content-container')

    // console.log(counties)

    map_svg.selectAll("text")
        .data(counties)
        .enter()
        .append("text")
        .text((d) => {
            let countyName = d.properties.name;
            let day = filterData(tempDate, countyName)
            let cases = 0;
            if (day[0]) { cases = day[0].cases }
            if (cases >= 2000) { return cases }
        })
        .attr("x", d => path.centroid(d)[0])
        .attr("y", d => path.centroid(d)[1])
        .attr("text-anchor", "middle")
        .attr('opacity', 1)
        .attr('class', 'cases-text')

    var formatTime = d3.timeFormat("%B %d, %Y");
    tempDate = formatTime(d3.timeParse('%Y-%m-%d')(tempDate))

    d3.select("#date").remove();

    let title = map_svg
        .append("text")
        .text(tempDate)
        .attr("font-size", "25pt")
        .attr("fill", "black")
        .attr("x", width * .50)
        .attr("y", 100)
        .attr('class', 'date')
        .attr('id', 'date')
        .attr("dx", 5)
        .attr("dy", 1)
        .attr('opacity', 1)



    function filterData(date, county) {
        return covidData.filter(d => {
            return (
                d.date == date &&
                d.county == county
            );
        });
    }

};

function type(d) {
    const parseDate = string => d3.timeParse('%Y-%m-%d')(string)
    const date = parseDate(d.date);
    return {
        cases: +d.cases,
        county: d.county,
        date: d.date,
        deaths: +d.deaths,
        fips: +d.fips,
        // population: +d.population,
        state: d.state
    }
}

function drawMap(path, counties, map_svg, height, width) {

    map_svg
        .attr('height', height)
        .attr('width', width)

    map_svg.selectAll('path')
        .data(counties)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', '#d8e2dc')
        .attr('stroke', 'white');

}

function filterData(data, date) {
    return data.filter(d => {
        return (
            d.date == date
        );
    });
}

const parseDate = string => d3.timeParse('%Y-%m-%d')(string)

function cleanData(data, numOfData) {

    let idx = 0;
    const cleanData = data
        .sort((a, b) => b.cases - a.cases)
        .filter((d, i) => {
            let numItems;
            idx += 1
                // console.log(d, i, idx)
                // if (idx < 20) {
                //     return i < idx
                // }
            return i < numOfData
        });

    return cleanData;
}