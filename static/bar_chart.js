let countyDataCSV = "static/county_data/all_counties.csv"
let countyDataURL = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv"

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

let idx = 0;
let dates = [];

Promise.all([
    d3.csv(countyDataURL, type)
]).then(([covidData]) => {

    covidData = covidData.filter(d => {
        return (
            d.state == "California"
        );
    })

    //collect all dates
    covidData.forEach((row) => {
        if (!dates.includes(row.date))
            dates.push(row.date)
    })

    // let initDate = covidData[idx].date
    let initDate = dates[idx]
    ready(covidData, initDate);
});

const parseNA = string => (string === 'NA' ? undefined : string)
const parseDate = string => d3.timeParse('%Y-%m-%d')(string)

// Type conversion
function type(d) {
    const date = parseDate(d.date);

    return {
        cases: +d.cases,
        county: d.county,
        date: d.date,
        formatedDate: date,
        deaths: +d.deaths,
        fips: +d.fips,
        population: +d.population,
        state: d.state
    }
}

// Data preparation

function filterState(data, state) {
    return data.filter(d => {
        return (
            d.state == state
        );
    });
}

function filterData(data, date) {
    return data.filter(d => {
        return (
            d.date == date
        );
    });
}

// Data Utilities
function formatTicks(d) {
    return d3.format('~s')(d)
        .replace('M', ' mil')
        .replace('G', ' bil')
        .replace('T', ' tril')
}

// Main function.
function ready(data, date) {

    let metric = 'cases';

    function nextDay(date) {
        let numToShow = 50;

        const dataClean = filterData(data, date)

        let numItems = dataClean.length;
        // idx = 0;
        const updatedData = dataClean
            .sort((a, b) => b.cases - a.cases)
            .filter((d, i) => {
                if (numItems < numToShow) {
                    return i < numItems
                }
                return i < numToShow
            });
        update(updatedData, date)
    }

    function update(data, date) {

        let numData = data.length

        // Update scales
        xScale.domain([0, d3.max(data, d => d.cases)])
        yScale
            .domain(data.map(d => d.county))
            .range([0, numData * 12])

        //Set up transition.
        const dur = 800;
        const t = d3.transition().duration(dur)

        function mouse() {
            console.log("mouseover")
        }
        let div = d3.select("body")
            .append("div")
            .attr("class", "bar-tooltip")
            .style("opacity", 0);

        bars
            .selectAll('.bar')
            .data(data, d => d.county)
            .join(
                enter => {
                    enter
                        .append('rect')
                        .on('mousemove', function(d, i) {
                            console.log(this.parentNode.parentNode.parentNode)
                            div
                                .transition()
                                .duration(200)
                                .style("opacity", .9)
                            div
                                .html(`
                                    <strong class='title'>${d.county} County</strong><br/>
                                    <span>Cases: ${numberWithCommas(d.cases)}</span><br/>
                                    <span>Deaths: ${numberWithCommas(d.deaths)}</span><br/>
                                    <span>Population: ${numberWithCommas(d.population)}</span><br/>
                                `)
                                .style("left", d3.event.pageX + 20 + "px")
                                .style("top", (d3.event.pageY - 30) + "px")
                                .style("display", "inline-block")
                        })
                        .on("mouseout", function(d) {
                            div.transition()
                                .duration(200)
                                .style("opacity", 0);
                        })
                        .attr('class', 'bar')
                        .attr('id', d => { return snake_it(d.county) })
                        .attr('height', 10)
                        .style('fill', 'dodgerblue')
                        .transition(t)
                        .delay((d, i) => i * 20)
                        .attr('y', d => yScale(d.county))
                        .attr('width', d => xScale(d[metric]))
                        .style('fill', 'dodgerblue');
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
                        .duration(20)
                        .style('fill-opacity', 0)
                        .remove();
                }
            )

        bars2
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
                        .attr('width', d => xScale(d.deaths))
                        .style('fill', 'red')
                },

                update => {
                    update
                        .transition(t)
                        .delay((d, i) => i * 20)
                        .attr('y', d => yScale(d.county))
                        .attr('width', d => xScale(d.deaths))
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

        let texBarColor = "black"
        barText.selectAll(".bar-text")
            .data(data)
            .join(
                enter => {
                    enter
                        .append("text")
                        .attr('class', 'bar-text')
                        .attr('id', d => { return snake_it(d.county) + "-text" })
                        .text(d => { return numberWithCommas(d.cases) })
                        .attr("font-size", "1pt")
                        .attr("fill", texBarColor)
                        .attr("y", d => yScale(d.county) + 5)
                        .attr("x", d => xScale(d.cases) + 5)
                        .attr('opacity', .1)
                        .attr("alignment-baseline", "central")
                        // .transition(t)
                        .transition()
                        .duration(600)
                        .delay((d, i) => i * 20)
                        .text(d => { return numberWithCommas(d.cases) })
                        .attr("font-size", "8pt")
                        .attr("y", d => yScale(d.county) + 5)
                        .attr("x", d => xScale(d.cases) + 5)
                        .attr('opacity', 1)
                        .attr("fill", texBarColor)
                },

                update => {
                    update
                        .transition()
                        .duration(600)
                        .delay((d, i) => i * 20)
                        .text(d => { return numberWithCommas(d.cases) })
                        .attr("x", d => xScale(d.cases) + 5)
                        .attr("y", d => yScale(d.county) + 5)
                        .attr("font-size", "8pt")
                        .attr('opacity', 1)

                },
                exit => {
                    exit
                        .transition()
                        .duration(dur / 2)
                        .style('fill-opacity', 0)
                        .remove()
                }
            )


        let formatTime = d3.timeFormat("%B %d, %Y");
        let tempDate = parseDate(date)
        tempDate = formatTime(tempDate)

        d3.select('#date').remove();

        let dateLabel = svg.append("text")
            .text(tempDate)
            .attr("font-size", "25pt")
            .attr("fill", colors2[3])
            .attr("x", width * .5)
            .attr("y", height * .6)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "central")
            .attr('class', 'date')
            .attr('id', 'date')
            .attr("dx", 5)
            .attr("dy", 1)
            .attr('opacity', 1)

        // update axes.
        xAxisDraw.transition(t).call(xAxis.scale(xScale));
        yAxisDraw.transition(t).call(yAxis.scale(yScale));

        yAxisDraw.selectAll('text').attr('dx', '-0.6em');

        headline.transition(t).text(`Total Cases By County on ${tempDate}`)
    }

    const dataClean = filterData(data, date)
    let dataIdx = 0;
    const day1Data = dataClean
        .sort((a, b) => b.cases - a.cases)
        .filter((d, i) => {
            let numItems;
            dataIdx += 1
            if (dataIdx < 20) {
                return i < dataIdx
            }
            return i < 25
        });



    // Margin Convention
    const margin = { top: 80, right: 80, bottom: 100, left: 100 }
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const xExtent = d3.extent(day1Data, (d) => { return d.cases })
    const xMax = d3.max(day1Data, function(d) { return d.cases })
    const yMax = d3.max(day1Data, function(d) { return d.county })

    let numData = day1Data.length;

    const xScale = d3.scaleLinear()
        .domain([0, xMax])
        .range([0, width])

    const yScale = d3.scaleBand()
        .domain(day1Data.map(d => d.county))
        .range([0, numData * 12])

    //     // .paddingInner("0.25px")

    // Draw base
    let svg = d3.select('.bar-chart-container')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Draw Header
    let header = svg
        .append('g')
        .attr('class', 'bar-header')
        .attr('transform', `translate(0, ${-margin.top / 2})`)
        .append('text');

    let headline = header.append('tspan').text('Total Cases');

    // Draw bars
    let bars = svg
        .append('g')
        .attr('class', 'bars');

    let barText = svg
        .append('g')
        .attr('class', 'bars-text');


    let bars2 = svg
        .append('g')
        .attr('class', 'bars');

    // Draw Axes
    let xAxis = d3
        .axisTop(xScale)
        .ticks(8)
        // .tickFormat("")
        .tickSizeInner(0)
        .tickSizeOuter(0)
        // .attr('fill', 'white')

    let xAxisDraw = svg
        .append('g')
        .attr('class', 'x axis')
        .call(xAxis)

    let yAxis = d3.axisLeft(yScale).tickSize(0);

    let yAxisDraw = svg
        .append('g')
        .attr('class', 'y axis')
        .call(yAxis)

    d3.select('.y .tick').remove()

    yAxisDraw.selectAll('text').attr('dx', '-0.6em')

    update(day1Data, date);

    let stopIndex = dates.length - 1;
    let pauseBtn = d3.select("#pause-btn");
    let resetBtn = d3.select("#reset-btn");
    let skipAhead5Btn = d3.select("#skip-ahead-5-btn");
    let skipBack5Btn = d3.select("#skip-back-5-btn");
    let skipAhead1Btn = d3.select("#skip-ahead-1-btn");
    let skipBack1Btn = d3.select("#skip-back-1-btn");
    let skipToLastBtn = d3.select("#skip-to-last-btn");
    let currentIdx;
    let refreshRate = 1000;


    function startInterval() {
        nextDay(dates[idx])
        idx += 1;
        if (idx > stopIndex) {
            myStopFunction(dates[stopIndex]);
        }
    }

    let interval = setInterval(function() {
        startInterval()
    }, refreshRate)

    pauseBtn.on("click", function() {

        if (pauseBtn.attr("class") == "pause") {
            currentIdx = idx;
            pause(currentIdx)

        } else

        if (pauseBtn.attr("class") == "start") {
            currentIdx = idx;
            start(currentIdx)
        }
    });

    resetBtn.on("click", function() {
        idx = 0;
        start(idx)
    });

    skipAhead5Btn.on("click", function() {
        pause(idx)
        idx += 5;
        if (idx >= dates.length - 1) {
            idx = dates.length - 1
        }
        nextDay(dates[idx])
    });

    skipBack5Btn.on("click", function() {
        pause(idx)
        idx -= 5;
        if (idx < 0) {
            idx = 0
        }
        nextDay(dates[idx])
    });

    skipAhead1Btn.on("click", function() {
        pause(idx)
        idx += 1;
        if (idx >= dates.length - 1) {
            idx = dates.length - 1
        }
        nextDay(dates[idx])
    });

    skipBack1Btn.on("click", function() {
        pause(idx)
        idx -= 1;
        if (idx < 0) {
            idx = 0
        }
        nextDay(dates[idx])
    });

    skipToLastBtn.on("click", function() {
        pause(idx)
        idx = dates.length - 1;
        nextDay(dates[idx])
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
        }, refreshRate);
    }

    function myStopFunction(date) {
        clearInterval(interval);
        nextDay(date);
    }
}

function snake_it(name) {
    return name.toLowerCase().split(" ").join("_")
}

function unsnake_it(name) {
    let newName = [];
    name = name.toLowerCase().split("_");
    name.forEach(d => newName.push(capitalize(d)))
    return newName.join(" ")
}

function capitalize(s) {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}

function numberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}