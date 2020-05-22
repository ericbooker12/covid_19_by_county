$( document ).ready(function() {


	$('#allData').on('click', function(event){
		event.preventDefault();



	// 	let county = $(this).text()
		console.log("clicked county")


	// 	$("#countyBtn").removeClass()
	// 	$("#countyBtn").addClass(county);
	// 	$("#render_scale").removeClass()
	// 	$("#render_scale").addClass(county);

		$.ajax({
			// data: $(this).text(),
			type: 'POST',
			url: '/allData'
		})
		.done(function(response){
			console.log(response)
			addCloropleth(response)
		});


	});

})

function addCloropleth(data){
	console.log("in cloropleth: ", data)

	$(".grid-container").remove()

	Promise.all( [d3.json('./static/topodata/cal_counties.topo.json')] )
		.then(([topology]) => {

			const counties = new CountyMap(topology)

			const countyGroup = counties.drawCounties()
			// map.colorCountries(countryGroup)
			// map.drawBubbles(countryGroup)
			// map.drawCapitals(capitals)
			// map.drawLegend()
		})
		.catch((err) => console.error('error fetching topojson:', err))

	// svg = d3.select('#map')


}

class CountyMap {
	constructor(topology) {
		this.svg = d3.select('body')
			.append('svg')
			.attr('id', 'map')
			.attr('height', 1000)
			.attr('width', "100%")

		const {height, width} = document.getElementById('map').getBoundingClientRect()
		const geojson = topojson.feature(topology, topology.objects['california_counties'])

		// const width = '100%'
		// const height = '100%'
		this.counties = geojson.features
		this.projection = d3.geoAlbers()
		this.projection
			.fitExtent([
				[ 0, 0 ],
				[ width, height ]
			], geojson)


		// console.log(this.counties)

	}

	drawCounties(){
		const path = d3.geoPath().projection(this.projection)

		const countyGroup = this.svg
			.append('g')
			.attr('class', 'counties')
			.selectAll('path')
			.data(this.counties)
			.enter()
			.append('path')
			.attr('d', path)
			.attr('fill', 'lightgray')
			.attr('stroke', 'white')
			.attr('transform', 'rotate(-25)')
			// .attr('transform', 'translate(0, 20)')
			.attr("transform", "translate(-20, 100) rotate(-15) scale(.8)")
			// .on('mouseover', this.showCounty.bind(this))
			.on('click', this.showCounty.bind(this))

		return countyGroup
	}

		showCounty(county, i, counties){
			console.log(county.properties.name)
		}
}

$( document ).ready(function() {




})








