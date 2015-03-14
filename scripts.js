var Svg = {}
Svg.margin = {top: 50, bottom: 50, left:50, right: 50};
Svg.width = 600 - Svg.margin.left - Svg.margin.right;
Svg.height = 500 - Svg.margin.top - Svg.margin.bottom;
Svg.bar_padding = 5;
Svg.bar_width = -1;
Svg.xType = "";

var Psets = {};
Psets.data = {};
Psets.current = -1;

function removeOutliers() {
  Psets.data.sort(function(a,b) { return a.minutes - b.minutes});
  var low = Math.round(Psets.data.length * 0.025);
  var high = Psets.data.length - low;
  Psets.data = Psets.data.slice(low,high);
}

function aggregate() {
  Svg.xType = "ordinal";

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

  Svg.svg = d3.select("body").append("svg")
              .attr("width", Svg.width + Svg.margin.left + Svg.margin.right)
              .attr("height", Svg.height + Svg.margin.top + Svg.margin.bottom);

  Svg.g = Svg.svg.append("g")
              .attr("transform", "translate(" + Svg.margin.left + "," + Svg.margin.top + ")");
}

function init_linear_scales() {

  Svg.xScale = d3.scale.linear()
    .domain([0, d3.max(Psets.data, function(d) { return d.minutes; })])
    .range([0, Svg.width]);

  Svg.layout = d3.layout.histogram()
    .bins(Svg.xScale.ticks(Svg.ticks))
    (Psets.data.map(function(d) { return d.minutes; }));

  Svg.yScale = d3.scale.linear()
    .domain([0, d3.max(Svg.layout, function(d) {return d.y})])
    .range([0, Svg.height]);

}

function init_ordinal_scales() {

  Svg.xScale = d3.scale.ordinal()
    .domain(Psets.data.map(function(d) { return d.pset; }))
    .rangeRoundBands([0, Svg.width], 0.5, 0);

  Svg.yScale = d3.scale.linear()
    .domain([0, d3.max(Psets.data, function(d) { return d.minutes; })])
    .range([0, Svg.height]);
}

var draw = function() {

  resetSvg();

  init_ordinal_scales();

  var bars = Svg.g.append("g")
    .selectAll("g.bar")
    .data(Psets.data)
    .enter()
    .append("g")
    .attr("class", "bar");

  Svg.bar_width = Svg.width / Psets.data.length - Svg.bar_padding;
  bars.append("rect")
    .attr("width", Svg.bar_width)
    .attr("height", function(d) { return Svg.yScale(d.minutes); } )
    .attr("x", function(d) { return Svg.xScale(d.pset); })
    .attr("y", function(d) { return Svg.height - Svg.yScale(d.minutes) })

  bars.append("text")
    .text(function(d) { return Math.round(d.minutes * 1) / 1 })
    .attr("x", function(d) { return Svg.xScale(d.pset) + (Svg.bar_width / 2) })
    .attr("y", function(d) { return Svg.height - Svg.yScale(d.minutes) + 50 });

  var xAxis = d3.svg.axis()
     .scale(Svg.xScale)
     .tickFormat(function(d) { return 'PS' + d });

  Svg.svg.append("g")
     .attr("class", "axis")
     .attr("transform", "translate(" + Svg.margin.left + "," + (Svg.height + Svg.margin.bottom) + ")")
     .call(xAxis);

  // Fixes text-anchor: middle that is being applied to axis labels
  d3.selectAll(".tick text").style('text-anchor', 'start');
}

function pset_time() {

  // Set approximate number of histogram bars.
  Svg.ticks = 10;

  // Filter out data from other psets.
  Psets.data = Psets.data.filter(function(d) {
    return d.file == Psets.current;
  });

  init_linear_scales();

  var xAxis = d3.svg.axis()
    .scale(Svg.xScale)
    .orient("bottom");

  resetSvg();

  var bars = Svg.g.append("g")
    .selectAll("g.bar")
    .data(Svg.layout)
    .enter()
    .append("g")
    .attr("class", "bar")

  Svg.bar_width = (Svg.width / Svg.ticks) - Svg.bar_padding;
  bars.append("rect")
    .attr("width", Svg.bar_width) // todo: fix overlap when d3 alters number of bins
    .attr("height", function(d) {return Svg.yScale(d.y); })
    .attr("x", function(d) { return Svg.xScale(d.x); })
    .attr("y", function(d) { return Svg.height - Svg.yScale(d.y); });

  bars.append("text")
    .text(function(d) { return d.y; })
    .attr("x", function(d) { return Svg.xScale(d.x) + (Svg.bar_width / 2) })
    .attr("y", function(d) { return Svg.height - Svg.yScale(d.y) + 20 });

  Svg.svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + Svg.margin.left + "," + (Svg.height + Svg.margin.bottom) + ")")
    .call(xAxis);

  d3.selectAll(".tick text").style('font-size', '10px');

}

d3.select("select#select-time").on("change", function() {
  Svg.xType = "linear";
  Psets.current = this.value;
  load_data([pset_time]);
})

function load_data(cbs) {
  d3.json("output/all.json", function(error, data) {
    Psets.data = data;

    removeOutliers();

    for (cb in cbs) { cbs[cb](); }
  });
}

load_data([aggregate, draw]);
