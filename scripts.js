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
 *    - Pie chart of class (year/extension)
 *    - Histogram of comfort level
 *    - Pie chart of CS50
 * - Sorting?
 *
 * Other:
 * - Link pset/midterm/time/welcome survey information
 * - Transitions between charts
 */

var Page = {}
Page.current = "general";

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
Svg.pie_encoding = "";

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

  Svg.svg = d3.select("#" + Page.current).append("svg")
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

function draw_pie() {

  var nested_rows = d3.nest()
    .key(function(d) { return d[Svg.pie_encoding]; })
    .entries(Psets.data);

  Psets.data = nested_rows.map(function(d) {
    return {label:d['key'], value:d.values.length};
  });

  Psets.data = Psets.data.filter(function(d) {
    return d.value > 1;
  });

  var color = d3.scale.category10();

  Svg.pie = d3.layout.pie()
    .value(function(d) { return d.value });
  Svg.pie(Psets.data);

  resetSvg();

  var outerRadius = Svg.width / 4;

  var arc = d3.svg.arc()
    .innerRadius(0)
    .outerRadius(outerRadius);

  var arcs = Svg.svg.selectAll("g.arc")
    .data(Svg.pie(Psets.data))
    .enter()
    .append("g")
    .attr("class", "arc")
    .attr("transform", "translate(" + outerRadius + ", " + outerRadius + ")");

  arcs.append("path")
    .attr("fill", function (d, i) {
      return color(i);
    })
    .attr("d", arc);

  arcs.append("text")
     .attr("transform", function(d) {
       return "translate(" + arc.centroid(d) + ")";
     })
     .attr("text-anchor", "middle")
     .text(function(d) {
       return d.value;
     });
}

d3.select("select#select-general").on("change", function() {
  Svg.pie_encoding = this.value;
  load_data([draw_pie]);
});

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
  if (Page.current == "general") {
    d3.json("output/welcome.json", function(error, data) {
      Psets.data = data;
      for (cb in cbs) { cbs[cb](); }
    });
  }

  else if (Page.current == "time") {
    d3.json("output/all.json", function(error, data) {
      Psets.data = data;
      removeOutliers();
      for (cb in cbs) { cbs[cb](); }
    });
  }
}

// load_data([year]);
// load_data([aggregate, draw]);
