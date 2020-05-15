function drawLegend(propertyNames, chart) {
			console.log("max cases = ", maxCases)
			var legendElements = [];

			var legend = chart
				.append("g")

			var elementHeight = 4;

			var xMargin = 5;
			var yMargin = 5;
			var xOrigin = 40;
			var yOrigin = 10;
			var width = 160;

			// var height = propertyNames.length * elementHeight * 6+ (2 * yMargin);
			var height = 60;

			var elementWidth = 40;

			legend
				.append("rect")
				.attr("x", xOrigin)
				.attr("y", yOrigin)
				.attr("id", "legend-box")
				.attr("stroke", "gray")
				.attr("radius", "5")
				// .attr("fill", "#ddd")
				.attr("fill", "white")
				.attr("width", width)
				.attr("height", height)


			for (var i = 0; i < propertyNames.length; i++) {
				var element =
					{
						color: d3.schemeCategory10[i],
						title: propertyNames[i]

					}
				legendElements.push(element)

				// console.dir(element)

			}

			currentY = yOrigin + yMargin;

			legendElements.forEach(function(x) {

				legend.append("rect")
					.attr("fill", x.color)
					.attr("x", xOrigin + xMargin + 5)
					.attr("y", currentY)
					.attr("width", elementWidth)
					.attr("height", elementHeight)
					.append("title")
					.text(x.title)

				// var title = x.title.length < 5 ? x.title : x.title.substring(0, 5) + "..."

				legend.append("text")
					.text(x.title)
					.attr("font-size", "10pt")
					.attr("fill", "black")
					.attr("x", elementWidth)
					.attr("y", currentY)
					.attr("dx", elementWidth + xMargin)
					.attr("dy", yMargin)

				currentY += elementHeight + 10

			});

		}