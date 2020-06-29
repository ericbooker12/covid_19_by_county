let countyData = "static/county_data/all_counties.csv"

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
    d3.csv(countyData, type)
]).then(([covidData]) => {

    covidData = covidData.filter(d => {
        return (
            d.state == "California"
        );
    })

    //get dates

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
            // .filter((d, i) => i < 10);
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

        bars
            .selectAll('.bar')
            .data(data, d => d.county)
            .join(
                enter => {
                    enter
                        .append('rect')
                        .attr('class', 'bar')

                    // .attr('height', d => yScale.bandwidth())
                    .attr('height', 10)
                        .style('fill', 'dodgerblue')
                        .transition(t)
                        .delay((d, i) => i * 20)
                        .attr('y', d => yScale(d.county))
                        .attr('width', d => xScale(d[metric]))
                        .style('fill', 'dodgerblue')

                },

                update => {
                    update
                        .transition(t)
                        .delay((d, i) => i * 20)
                        .attr('y', d => yScale(d.county))
                        .attr('width', d => xScale(d[metric]))
                        .attr('height', 10)
                        // .attr('height', d => yScale.bandwidth())
                },
                exit => {
                    exit
                        .transition()
                        .duration(20)
                        .style('fill-opacity', 0)
                        .remove()
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

        var formatTime = d3.timeFormat("%B %d, %Y");
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
    const margin = { top: 80, right: 40, bottom: 100, left: 100 }
    const width = 600 - margin.left - margin.right;
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
    const svg = d3.select('.bar-chart-container')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Draw Header
    const header = svg
        .append('g')
        .attr('class', 'bar-header')
        .attr('transform', `translate(0, ${-margin.top / 2})`)
        .append('text');

    const headline = header.append('tspan').text('Total Cases')

    // const button = d3.select('.bar-chart-container')
    //     .append("svg")
    //     .attr('id', "pause-btn")
    //     .attr('class', 'pause')
    //     .attr("width", 60)
    //     .attr("height", 20)
    //     .attr("fill", "gray")
    //     .attr('transform', `translate(${100}, ${height - 50})`)
    //     .attr('y', 300)
    //     .text("Pause Animation")

    // header.append('tspan').text('By county')
    //     .attr('x', 0)
    //     .attr('y', '1.5em')
    //     .style('font-size', '0.8em')
    //     .style('fill', '#555')

    // Draw bars
    const bars = svg
        .append('g')
        .attr('class', 'bars');

    const bars2 = svg
        .append('g')
        .attr('class', 'bars');

    // Draw Axes
    const xAxis = d3
        .axisTop(xScale)
        .ticks(8)
        // .tickFormat("")
        .tickSizeInner(-height)
        .tickSizeOuter(0)
        // .attr('fill', 'white')


    const xAxisDraw = svg
        .append('g')
        .attr('class', 'x axis')
        .call(xAxis)

    const yAxis = d3.axisLeft(yScale).tickSize(0);

    const yAxisDraw = svg
        .append('g')
        .attr('class', 'y axis')
        .call(yAxis)

    d3.select('.y .tick').remove()

    yAxisDraw.selectAll('text').attr('dx', '-0.6em')

    update(day1Data, date);

    let stopIndex = dates.length - 1;
    let pauseBtn = d3.select("#pause-btn");
    let currentIdx;

    function startInterval() {

        nextDay(dates[idx])

        idx += 1;
        if (idx > stopIndex) {
            myStopFunction(dates[stopIndex]);
        }
    }

    let interval = setInterval(function() {
        startInterval()

    }, 1000)

    pauseBtn.on("click", function() {

        if (pauseBtn.attr("class") == "pause") {
            currentIdx = idx;
            pause(currentIdx)

        } else

        if (pauseBtn.attr("class") == "start") {
            start(currentIdx)
        }

    });

    function pause(currentIdx) {
        clearInterval(interval);
        pauseBtn
            .html("Resume")
        pauseBtn
            .attr("class", "start")
    }

    function start(currentIdx) {
        pauseBtn.html("Pause")
        pauseBtn.attr("class", "pause")

        interval = setInterval(function() {
            startInterval()
        }, 1000)
    }

    function myStopFunction(date) {
        interval = clearInterval(interval);
        nextDay(date)
    }

}