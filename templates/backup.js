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

    covidData = covidData.filter(d => (d.state == "California"));

    ready(topoData, covidData)
        // readyBars(covidData, date)

});

function type(d) {
    const parseDate = string => d3.timeParse('%Y-%m-%d')(string)
    const date = parseDate(d.date);
    return {
        cases: +d.cases,
        county: d.county,
        date: d.date,
        deaths: +d.deaths,
        fips: +d.fips,
        population: +d.population,
        state: d.state
    }
}

function ready(topoData, covidData) {


    readyMap(topoData, covidData)

}

function readyMap(topoData, covidData) {
    let dates = [];
    let parsedDates = [];


    covidData.forEach((row) => {
        if (!dates.includes(row.date))
            dates.push(row.date)
    })

    const parseDate = string => d3.timeParse('%Y-%m-%d')(string)
    dates.forEach(d => parsedDates.push(parseDate(d)));

    let { height, width, x, y } = document.getElementById('bubbles')
        .getBoundingClientRect()

    let geojson = topojson.feature(topoData, topoData.objects['california_counties'])
    let counties = geojson.features
    let projection = d3.geoMercator()
        .fitExtent([
            [0, 25],
            [width, height - 50]
        ], geojson)

    let path = d3.geoPath().projection(projection)

    drawMap(height, width, counties, path)

    let refreshRate = 500;
    let i = 0;
    let dateIndex = 20;
    let numOfRecords = dates.length;
    let tempDate;
    let initDate = dates[50]

    readyBars(covidData, dates[30])


    const interval = setInterval(function() {
        tempDate = dates[dateIndex]
        i += 1;
        dateIndex += 1;
        if (dateIndex == numOfRecords - 1) {
            myStopFunction()
        }
        // readyBars(covidData, tempDate);
        drawDots(tempDate, counties, path, covidData, width, height);

    }, refreshRate);

    function myStopFunction() {
        clearInterval(interval);
    }

    function readyBars(data, date) {

        let metric = "cases"

        let numToShow = 50;

        const dataClean = filterBarData(data, date)


        let numItems = dataClean.length;
        let idx = 0;

        const updatedData = dataClean
            .sort((a, b) => b.cases - a.cases)
            // .filter((d, i) => i < 10);
            .filter((d, i) => {
                if (numItems < numToShow) {
                    return i < numItems
                }
                return i < numToShow
            });


        let numData = data.length

        let { height, width, x, y } = document.getElementById('bars')
            .getBoundingClientRect()
        const xMax = d3.max(data, function(d) { return d.cases })
        const yMax = d3.max(data, function(d) { return d.county })

        const xScale = d3.scaleLinear()
            .domain([0, xMax])
            .range([0, width])

        const yScale = d3.scaleBand()
            .domain(data.map(d => d.county))
            .range([0, numData * 12])

        const svg = d3.select('#bars')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(50, 50)`);

        const header = svg
            .append('g')
            .attr('class', 'bar-header')
            .attr('transform', `translate(0, -20)`)
            .append('text');

        const headline = header.append('tspan').text('Total Cases')
            // Draw bars
        const bars = svg
            .append('g')
            .attr('class', 'bars');

        // Draw Axes
        const xAxis = d3
            .axisTop(xScale)
            .ticks(8)
            .tickSizeInner(-height)
            .tickSizeOuter(0)


        const xAxisDraw = svg
            .append('g')
            .attr('class', 'x axis')
            .call(xAxis)

        const yAxis = d3.axisLeft(yScale).tickSize(0);

        // update(data, date)








        function updateBars(data, date) {
            let numData = data.length

            // Update scales
            xScale.domain([0, d3.max(data, d => d.cases)])
            yScale
                .domain(data.map(d => d.county))
                .range([0, numData * 12])

            const dur = 500;
            const t = d3.transition().duration(dur)

            bars
                .selectAll('.bar')
                .data(data, d => d.county)
                .join(
                    enter => {
                        enter
                            .append('rect')
                            .attr('class', 'bar')
                            .attr('y', d => yScale(d.county))
                            // .attr('height', d => yScale.bandwidth())
                            .attr('height', 10)
                            .style('fill', 'lightcyan')
                            .transition(t)
                            .delay((d, i) => i * 20)
                            .attr('width', d => xScale(d.cases))
                            .style('fill', 'dodgerblue')

                    },

                    update => {
                        update
                            .transition(t)
                            .delay((d, i) => i * 20)
                            .attr('y', d => yScale(d.county))
                            .attr('width', d => xScale(d.cases))
                            .attr('height', 10)
                            // .attr('height', d => yScale.bandwidth())
                    },
                    exit => {
                        exit
                            .transition()
                            .duration(dur / 2)
                            .style('fill-opacity', 0)
                            .remove()
                    }
                )

        }
    }


}


//counties, path, covidData
function drawDots(date, counties, path, covidData, width, height) {

    // console.log(tempDate)

    d3.selectAll('.circle').remove()

    let mapSvg = d3.select('#california_map');

    let points = mapSvg
        .append('g')
        .selectAll('circle')
        .data(counties)
        .join(
            enter => {
                enter
                    .append('circle')
                    .attr('cx', (d) => {
                        return path.centroid(d)[0]
                    })
                    .attr('cy', (d) => path.centroid(d)[1])
                    .transition().duration(200)
                    .attr('r', (d) => {
                        let countyName = d.properties.name;
                        let day = filterData(covidData, date, countyName);
                        let cases = 0;

                        if (day[0]) { cases = day[0].cases }
                        let radius = Math.sqrt(cases);
                        if (cases >= 2000) { radius = Math.sqrt(2000) }

                        return radius;
                    })
                    .attr('fill', (d) => {
                        let countyName = d.properties.name;
                        let day = filterData(covidData, date, countyName)
                        return day[0] ? getFillColor(day[0].cases) : 'red'
                    })
                    .attr('opacity', .8)
                    .attr('class', 'circle');
            },
            update => {
                update
                    .transition().duration(200)
                    .delay((d, i) => i * 20)
                    .attr('r', (d) => {
                        let countyName = d.properties.name;
                        let day = filterData(covidData, date, countyName);
                        let cases = 0;

                        if (day[0]) { cases = day[0].cases }
                        let radius = Math.sqrt(cases);
                        if (cases >= 2000) { radius = Math.sqrt(2000) }

                        return radius;
                    })
                    .attr('fill', (d) => {
                        let countyName = d.properties.name;
                        let day = filterData(covidData, date, countyName)
                        return day[0] ? getFillColor(day[0].cases) : 'red'
                    })

            },
            exit => {
                exit
                    .transition()
                    .duration(250)
                    .attr('opacity', 0)
                    .remove()
            }
        )
    d3.selectAll('.cases-text').remove()

    mapSvg.selectAll("text")
        .data(counties)
        .enter()
        .append("text")
        .text((d) => {
            let countyName = d.properties.name;
            let day = filterData(covidData, date, countyName)
            let cases = 0;
            if (day[0]) { cases = day[0].cases }
            if (cases >= 2000) { return cases }
        })
        .attr("x", d => path.centroid(d)[0])
        .attr("y", d => path.centroid(d)[1])
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .attr('opacity', 1)
        .attr('class', 'cases-text');

    var formatTime = d3.timeFormat("%B %d, %Y");
    date = formatTime(d3.timeParse('%Y-%m-%d')(date))

    d3.select("#date").remove();

    let title = mapSvg.append("text")
        .text(date)
        .attr("font-size", "20pt")
        .attr("fill", colors2[2])
        .attr("x", 50)
        .attr("y", height - 50)
        .attr('class', 'date')
        .attr('id', 'date')
        .attr("dx", 5)
        .attr("dy", 1)
        .attr('opacity', 1)


};

function filterByDate(data, date) {
    return data.filter(d => {
        return (
            d.date == date
        );
    });
}

function filterData(data, date, county) {
    return data.filter(d => {
        return (
            d.date == date &&
            d.county == county
        );
    });
}

function getFillColor(cases) {

    if (cases >= 12500) {
        return "red"
    } else if (cases >= 10000) {
        return colors2[4]
    } else if (cases >= 7500) {
        return colors2[5]
    } else if (cases >= 5000) {
        return colors2[6]
    } else if (cases >= 2000) {
        return colors2[7]
    } else return '#2090b3'
}

function drawMap(height, width, counties, path) {
    console.log("Map Drawn")

    let map_svg = d3.select('.animated-map')
        .append('svg')
        .attr('id', 'california_map')
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

function filterBarData(data, date) {
    return data.filter(d => {
        return (
            d.date == date
        );
    });
}