.on('mouseover', (d, i, counties) => {
 d3.select(counties[i]).transition().attr('fill', 'lightblue')
 const [ x, y ] = path.centroid(d)

 this.tooltip.showStats(x, y, d)
})
.on('mouseout', (d, i, counties) => {
	d3.select(counties[i]).transition()
	.attr('fill', function(county){
		let countyName = county.properties.name;
		let cases;

		casesPerCapita.forEach(function(c){
			if (c.county == countyName){
				cases = c.cases_per_capita
			}
		})

			return scale(cases)

	})
})

class Tooltip {
	constructor (svgX, svgY, data) {
		console.log(data)
		this.data = data
		this.svgX = svgX
		this.svgY = svgY

		this.div = d3.select('body').append('div')
			.attr('class', 'tooltip')
			.style('opacity', 0);

	}

	showStats(x, y, county) {

		this.remove()

		let countyName;
		let cases;
		let deaths;
		let population;

		this.data.forEach((d) => {
			if (d.county == county.properties.name){
				countyName = d.county
				cases = d.cases
				deaths = d.deaths
				population = d.population
			}
		})

		let perCapita = ((cases * 100000) / population).toFixed(1)

		this.div.transition().duration(200).style('opacity', 1)


		this.div
			.html(`
				<strong class='title'>${countyName} County</strong><br/>
				<span>Cases: ${cases}</span><br/>
				<span>Deaths: ${deaths}</span><br/>
				<span>Population: ${population}</span><br/>
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
		//

	remove() {
		this.div.transition().duration(200).style('opacity', 0)
	}

}