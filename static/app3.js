$( document ).ready(function() {


	$('#allData').on('click', function(event){
		event.preventDefault();


	// 	let county = $(this).text()
	// 	console.log(county)

	// 	$("#countyBtn").removeClass()
	// 	$("#countyBtn").addClass(county);
	// 	$("#render_scale").removeClass()
	// 	$("#render_scale").addClass(county);

	// 	$.ajax({
	// 		data: $(this).text(),
	// 		type: 'POST',
	// 		url: '/' + county
	// 	})
	// 	.done(function(response){
	// 		makeData(response, "ajax", .5, county)
	// 	});
	// });

	// $('#countyBtn').on('click', function(event){
	// 	event.preventDefault();

	// 	var county = $(this).attr("class");

	// 	county = county.toLowerCase().split(' ').join('_')

	// 	d3.csv("/static/data/" + county + ".csv")
	// 		.then(function(data) {

	// 			makeData(data, 'csv', .5, county)
	// 		});

	});

})