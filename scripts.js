/*
 * TODO
 * Bug fixes:
 * - Handle case where bar text doesn't fit on bar
 * - Add "PS" prefix to averages chart
 * - Fix overlapping bars / varied bar padding
 * - Explanatory y axis labels
 *
 * Features:
 * - Type in time spent or pset score, appropriate column changes color
 * - View grades/time spent by year
 * - 2015 time spent data
 * - Pset/midterm scores
 * - Welcome survey information
 * - Sorting?
 *
 * Other:
 * - Link pset/midterm/time/welcome survey information
 * - Transitions between charts
 */

var Svg = {}
Svg.margin = {top: 50, bottom: 50, left:50, right: 50};
Svg.width = 600 - Svg.margin.left - Svg.margin.right;
Svg.height = 500 - Svg.margin.top - Svg.margin.bottom;
Svg.text_offset = -1;
Svg.bar_padding = 5;
Svg.bar_width = -1;
Svg.x_type = "";
Svg.x_encoding = "";
Svg.y_encoding = "";

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
  Svg.x_encoding = "pset";
  Svg.y_encoding = "minutes";
  Svg.x_type = "ordinal";
  Svg.text_offset = 50;

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

  // Set approximate number of histogram bars.
  var num_ticks = 10;

  Svg.xScale = d3.scale.linear()
    .domain([0, d3.max(Psets.data, function(d) { return d.minutes; })])
    .range([0, Svg.width]);

  Psets.data = d3.layout.histogram()
    .bins(Svg.xScale.ticks(num_ticks))
    (Psets.data.map(function(d) { return d.minutes; }));

  Svg.yScale = d3.scale.linear()
    .domain([0, d3.max(Psets.data, function(d) {return d.y})])
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

  if (Svg.x_type == "linear") {
    init_linear_scales();
  }
  else if (Svg.x_type == "ordinal") {
    init_ordinal_scales();
  }

  var bars = Svg.g.append("g")
    .selectAll("g.bar")
    .data(Psets.data)
    .enter()
    .append("g")
    .attr("class", "bar");

  Svg.bar_width = Svg.width / Psets.data.length - Svg.bar_padding;
  bars.append("rect")
    .attr("width", Svg.bar_width)
    .attr("height", function(d) { return Svg.yScale(d[Svg.y_encoding]); } )
    .attr("x", function(d) { return Svg.xScale(d[Svg.x_encoding]); })
    .attr("y", function(d) { return Svg.height - Svg.yScale(d[Svg.y_encoding]) })

  bars.append("text")
    .text(function(d) { return Math.round(d[Svg.y_encoding] * 1) / 1 })
    .attr("x", function(d) { return Svg.xScale(d[Svg.x_encoding]) + (Svg.bar_width / 2) })
    .attr("y", function(d) { return Svg.height - Svg.yScale(d[Svg.y_encoding]) + Svg.text_offset });

  var xAxis = d3.svg.axis()
     .scale(Svg.xScale);

  Svg.svg.append("g")
     .attr("class", "axis")
     .attr("transform", "translate(" + Svg.margin.left + "," + (Svg.height + Svg.margin.bottom) + ")")
     .call(xAxis);

  // Fixes text-anchor: middle that is being applied to axis labels
  d3.selectAll(".tick text").style('text-anchor', 'start');
}

function pset_time() {

  // Filter out data from other psets.
  Psets.data = Psets.data.filter(function(d) {
    return d.file == Psets.current;
  });

  Svg.x_encoding = "x";
  Svg.y_encoding = "y";
  Svg.x_type = "linear";
  Svg.text_offset = 20;

  draw();

  d3.selectAll(".tick text").style('font-size', '10px');

}

d3.select("select#select-time").on("change", function() {
  if (this.value == "all") {
    load_data([aggregate, draw]);
  }
  else {
    Psets.current = this.value;
    load_data([pset_time]);
  }
})

function load_data(cbs) {
  d3.json("output/all.json", function(error, data) {
    Psets.data = data;

    removeOutliers();

    for (cb in cbs) { cbs[cb](); }
  });
}

load_data([aggregate, draw]);
