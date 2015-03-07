var Svg = {}
Svg.margin = {top: 50, bottom: 10, left:300, right: 40};
Svg.width = 900 - Svg.margin.left - Svg.margin.right;
Svg.height = 900 - Svg.margin.top - Svg.margin.bottom;

var Psets = {}
Psets.data = {}

function removeOutliers() {
  Psets.data.sort(function(a,b) { return a.minutes - b.minutes});
  var low = Math.round(Psets.data.length * 0.025);
  var high = Psets.data.length - low;
  Psets.data = Psets.data.slice(low,high);
}

function aggregate() {
  var nested_rows = d3.nest()
    .key(function(d) { return d.file; })
    .rollup(function(leaves) {
      return {
          "pset": leaves[0].pset,
          "file": leaves[0].file,
          "minutes": d3.mean(leaves, function(d) {return d.minutes})
      }
  })
    .entries(Psets.data);

  var data = nested_rows.map(function (d) {
      return {
          "pset": d.values['pset'],
          "file": d.values['file'],
          "minutes": d.values['minutes']
      }
  });

  nested_rows = d3.nest()
    .key(function(d) {return d.pset; })
    .rollup(function(leaves) {
      return {
        "pset": leaves[0].pset,
        "file": leaves[0].file,
        "minutes": d3.sum(leaves, function(d) {return d.minutes})
      }
    })
    .entries(data);

  data = nested_rows.map(function (d) {
      return {
          "pset": d.values['pset'],
          "file": d.values['file'],
          "minutes": d.values['minutes']
      }
  });

  Psets.data = data;
}

var resetSvg = function() {

  d3.select('svg').remove();

  Svg.xScale = d3.scale.linear().range([0, Svg.width]);
  Svg.yScale = d3.scale.ordinal().rangeRoundBands([0, Svg.height], 0.5, 0);


  Svg.svg = d3.select("body").append("svg")
              .attr("width", Svg.width + Svg.margin.left + Svg.margin.right)
              .attr("height", Svg.height + Svg.margin.top + Svg.margin.bottom);

  Svg.g = Svg.svg.append("g")
              .attr("transform", "translate(" + Svg.margin.left + "," + Svg.margin.top + ")");
}

var draw = function() {

  resetSvg();

  var max = d3.max(Psets.data, function(d) { return d.minutes; } );
  var min = 0;

  Svg.xScale.domain([min, max]);
  Svg.yScale.domain(Psets.data.map(function(d) { return d.pset; }));

  var rows = Svg.g.append("g")
    .selectAll("g.row")
    .data(Psets.data)
    .enter()
    .append("g")
    .attr("class", "row");

  rows.append("rect")
    .attr("width", function(d) { return Svg.xScale(d.minutes); })
    .attr("height", 5)
    .attr("x", Svg.xScale(min))
    .attr("y", function(d) { return Svg.yScale(d.pset); });

  rows.append("text")
    .text(function(d) { return Math.round(d.minutes * 1) / 1 })
    .attr("x", Svg.xScale(min))
    .attr("y", function(d) { return Svg.yScale(d.pset) });

  var yAxis = d3.svg.axis()
     .scale(Svg.yScale)
     .orient("left");

  Svg.svg.append("g")
     .attr("class", "axis")
     .attr("transform", "translate(" + Svg.margin.left + "," + Svg.margin.top + ")")
     .call(yAxis);
}

// todo(ben): layout for individual problem sets
function pset_layout(pset) {
  console.log(pset);
}

d3.select("input[value=\"ps2\"]").on("click", function() {
  pset_layout(this.value);
});

function load_data(cb) {
  d3.json("output/all.json", function(error, data) {
    Psets.data = data;

    removeOutliers();
    aggregate();

    if (cb) { cb(); }
  });
}

load_data(draw)
