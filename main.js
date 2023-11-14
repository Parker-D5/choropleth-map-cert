import "/style.scss";
import * as d3 from "/node_modules/d3";
import * as topojson from "/node_modules/topojson";

function createMap(education, counties) {
  const margin = { left: 50, top: 50, right: 50, bottom: 50 };
  const width = 1500;
  const height = 700;

  const color = d3
    .scaleThreshold()
    .domain(d3.range(2.6, 75.1, (75.1 - 2.6) / 8))
    .range(d3.schemePurples[9]);

  const legendX = d3
    .scaleLinear()
    .domain([
      d3.min(education, (d) => d.bachelorsOrHigher),
      d3.max(education, (d) => d.bachelorsOrHigher),
    ])
    .rangeRound([600, 860]);

  const svg = d3.select("svg");

  const tooltip = d3
    .select(".map-container")
    .append("div")
    .attr("class", "tooltip")
    .attr("id", "tooltip")
    .style("opacity", "0");

  const legend = svg
    .append("g")
    .attr("class", "key")
    .attr("id", "legend")
    .attr("transform", "translate(0,50)");

  legend
    .selectAll("rect")
    .data(
      color.range().map(function (d) {
        d = color.invertExtent(d);
        if (d[0] === null) {
          d[0] = x.domain()[0];
        }
        if (d[1] === null) {
          d[1] = x.domain()[1];
        }
        return d;
      })
    )
    .join("rect")
    .attr("height", 10)
    .attr("x", (d) => legendX(d[0]))
    .attr("width", (d) =>
      d[0] && d[1] ? legendX(d[1]) - legendX(d[0]) : legendX(null)
    )
    .attr("fill", (d) => color(d[0]));

  legend
    .call(
      d3
        .axisBottom(legendX)
        .tickSize(13)
        .tickFormat(function (x) {
          return Math.round(x) + "%";
        })
        .tickValues(color.domain())
    )
    .select(".domain")
    .remove();

  console.log(counties);

  svg
    .append("g")
    .attr("class", "counties-container")
    .selectAll("path")
    .data(topojson.feature(counties, counties.objects.counties).features)
    .join("path")
    .attr("class", "county")
    .attr("data-fips", (d) => d.id)
    .attr("data-education", function (d) {
      let result = education.filter((object) => object.fips === d.id);
      if (result[0]) {
        return result[0].bachelorsOrHigher;
      }
      return 0;
    })
    .attr("fill", function (d) {
      let result = education.filter((object) => object.fips === d.id);
      if (result[0]) {
        return color(result[0].bachelorsOrHigher);
      }
      return color(0);
    })
    .attr("d", d3.geoPath())
    .on("mouseover", function (event, d) {
      tooltip.style("opacity", 0.9);
      tooltip
        .html(function (obj) {
          var result = education.filter(function (obj) {
            return obj.fips === d.id;
          });
          if (result[0]) {
            return (
              result[0]["area_name"] +
              ", " +
              result[0]["state"] +
              ": " +
              result[0].bachelorsOrHigher +
              "%"
            );
          }
          return 0;
        })
        .attr("data-education", function () {
          var result = education.filter(function (obj) {
            return obj.fips === d.id;
          });
          if (result[0]) {
            return result[0].bachelorsOrHigher;
          }
          return 0;
        })
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("opacity", 0);
    });

  svg
    .append("path")
    .datum(
      topojson.mesh(counties, counties.objects.states, function (a, b) {
        return a !== b;
      })
    )
    .attr("class", "states")
    .attr("d", d3.geoPath());
}

Promise.all([
  d3.json(
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
  ),
  d3.json(
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
  ),
]).then(function (d) {
  console.log(d);
  createMap(d[0], d[1]);
});
