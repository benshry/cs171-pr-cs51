/*
 * TODO
 * Bug fixes:
 * - Handle case where bar text doesn't fit on bar
 * - Add "PS" prefix to averages chart
 * - Fix overlapping bars / varied bar padding
 * - Explanatory y axis labels / legends
 * - Axis text size
 *
 * Features:
 * - Type in time spent or pset score, appropriate column changes color
 * - View grades/time spent by year
 * - 2015 time spent data
 * - 2014 welcome survey information?
 * - midterm scores
 * - Sorting?
 *
 * Other:
 * - Link pset/midterm/time/welcome survey information
 * - Transitions between charts
 * - Standardize on underscores, not camelcase (embarrassing)
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
Svg.bins = "";
Svg.num_ticks = 10;
Svg.pie_encoding = "";
Svg.outer_radius = Svg.width / 4;
Svg.color = d3.scale.category10();


var Psets = {};
Psets.data = {};
Psets.current = -1;

/*
 * Removes zero values for an individual pset from Psets.data
 */
function remove_zeros() {
  Psets.data = Psets.data.filter(function(d) {
    return d[Psets.current] != "0" && d[Psets.current] != ""
  })
}

/*
 * Sorts Psets.data and removes a few outliers from each extreme.
 */
function removeOutliers() {
  Psets.data.sort(function(a,b) { return a.minutes - b.minutes});
  var low = Math.round(Psets.data.length * 0.025);
  var high = Psets.data.length - low;
  Psets.data = Psets.data.slice(low,high);
}

/*
 * Updates Psets.data to contain per problem set averages of minutes spent.
 */
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

/*
 * Updates Psets.data to contain per problem set averages of grades.
 */
function aggregate_grades() {

  Svg.x_encoding = "pset";
  Svg.y_encoding = "grade";
  Svg.x_type = "ordinal";
  Svg.text_offset = 50;

  Psets.data = [
    { "pset": 1, "grade": d3.mean(Psets.data, function(d) {return d.ps1}) },
    { "pset": 2, "grade": d3.mean(Psets.data, function(d) {return d.ps2}) },
    { "pset": 3, "grade": d3.mean(Psets.data, function(d) {return d.ps3}) }
  ]

}

/*
 * Removes and redraws SVG element.
 * Should be called at the start of any draw_* function
 */
var resetSvg = function() {

  d3.select('svg').remove();

  Svg.svg = d3.select("#" + Page.current).append("svg")
              .attr("width", Svg.width + Svg.margin.left + Svg.margin.right)
              .attr("height", Svg.height + Svg.margin.top + Svg.margin.bottom);

  Svg.g = Svg.svg.append("g")
              .attr("transform", "translate(" + Svg.margin.left + "," + Svg.margin.top + ")");
}

/*
 * Creates x and y scales for histogram. Also updates Psets.data to be
 * the histogram layout.
 * Requires:
 * - Svg.num_ticks (number of ticks in histogram)
 * - Svg.bins (data represented in histogram bins)
 */
function init_linear_scales() {

  Svg.xScale = d3.scale.linear()
    .domain([0, d3.max(Psets.data, function(d) { return d[Svg.bins]; })])
    .range([0, Svg.width]);

  Psets.data = d3.layout.histogram()
    .bins(Svg.xScale.ticks(Svg.num_ticks))
    (Psets.data.map(function(d) { return d[Svg.bins]; }));

  Svg.yScale = d3.scale.linear()
    .domain([0, d3.max(Psets.data, function(d) {return d.y})])
    .range([0, Svg.height]);

}

/*
 * Creates x and y scales for standard bar chart.
 * Currently built only for displaying y axis of minutes and x axis of pset.
 */
function init_ordinal_scales() {

  Svg.xScale = d3.scale.ordinal()
    .domain(Psets.data.map(function(d) { return d[Svg.x_encoding]; }))
    .rangeRoundBands([0, Svg.width], 0.5, 0);

  Svg.yScale = d3.scale.linear()
    .domain([0, d3.max(Psets.data, function(d) { return d[Svg.y_encoding]; })])
    .range([0, Svg.height]);
}

/*
 * Draws a bar chart using the data in Psets.data.
 * Requires:
 * - Svg.x_type (type of x axis; i.e., linear or ordinal)
 * - Svg.x_encoding (data field used for x axis; i.e., psets)
 * - Svg.y_encoding (data field used for y axis; i.e., minutes)
 */
var draw_bar = function() {

  resetSvg();

  // Initialize scales, linear for histograms and ordinal for bar chart
  if (Svg.x_type == "linear") {
    init_linear_scales();
  }
  else if (Svg.x_type == "ordinal") {
    init_ordinal_scales();
  }

  Svg.bar_width = Svg.width / Psets.data.length - Svg.bar_padding;

  var bars = Svg.g.append("g")
    .selectAll("g.bar")
    .data(Psets.data)
    .enter()
    .append("g")
    .attr("class", "bar");

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

/*
 * Sets fields common to all histograms.
 */
function prepare_histogram() {
  Svg.x_encoding = "x";
  Svg.y_encoding = "y";
  Svg.x_type = "linear";
  Svg.text_offset = 20;
}

/*
 * Sets fields for histogram of self-reported comfort levels.
 */
function histogram_comfort() {
  prepare_histogram();
  Svg.bins = "comfort";
}

/*
 * Sets fields for histogram of time spent on an individual problem set.
 */
function histogram_pset_time() {
  Psets.data = Psets.data.filter(function(d) {
    return d.file == Psets.current;
  });
  prepare_histogram();
  Svg.bins = "minutes";
}

/*
 * Sets fields for histogram of grades on an individual problem set.
 */
function histogram_pset_grades() {
  remove_zeros();
  prepare_histogram();
  Svg.bins = Psets.current;
}

/*
 * Changes Pset.data to an appropriate form for drawing a pie chart.
 * Output is a list of objects {label: x, value: y}, where the value
 * determines the size of the pie chart segments and label provides
 * the label.
 */
function prepare_data_pie() {

  var nested_rows = d3.nest()
    .key(function(d) { return d[Svg.pie_encoding]; })
    .entries(Psets.data);

  Psets.data = nested_rows.map(function(d) {
    return {label:d['key'], value:d.values.length};
  });

  Psets.data = Psets.data.filter(function(d) {
    return d.value > 1;
  });

}

/*
 * Draws a pie chart using the data in Psets.data.
 * Requires:
 * - Svg.pie_encoding (data field used for pie chart)
 * - Data must be prepared using prepare_data_pie
 */
function draw_pie() {

  resetSvg();

  Svg.pie = d3.layout.pie().value(function(d) { return d.value });

  var arc = d3.svg.arc()
    .innerRadius(0)
    .outerRadius(Svg.outer_radius);

  var arcs = Svg.svg.selectAll("g.arc")
    .data(Svg.pie(Psets.data))
    .enter()
    .append("g")
    .attr("class", "arc")
    .attr("transform", "translate(" + Svg.outer_radius + ", " + Svg.outer_radius + ")");

  arcs.append("path")
    .attr("fill", function (d, i) { return Svg.color(i); })
    .attr("d", arc);

  arcs.append("text")
     .attr("transform", function(d) {
       return "translate(" + arc.centroid(d) + ")";
     })
     .attr("text-anchor", "middle")
     .text(function(d) { return d.data.label; });
}

// Event handler for general tab's dropdown.
d3.select("select#select-general").on("change", function() {
  if (this.value == "comfort") {
    Svg.num_ticks = 10;
    load_data([histogram_comfort, draw_bar]);
  }
  else {
    Svg.pie_encoding = this.value;
    load_data([prepare_data_pie, draw_pie]);
  }
});

// Event handler for time tab's dropdown.
d3.select("select#select-time").on("change", function() {
  if (this.value == "all") {
    load_data([aggregate, draw_bar]);
  }
  else {
    Psets.current = this.value;
    Svg.num_ticks = 10;
    load_data([histogram_pset_time, draw_bar]);
  }
})

// Event handler for grades tab's dropdown.
d3.select("select#select-grades").on("change", function() {
  if (this.value == "all") {
    load_data([aggregate_grades, draw_bar]);
  }
  else {
    Psets.current = this.value;
    Svg.num_ticks = 10;
    load_data([histogram_pset_grades, draw_bar]);
  }
})

// Event handler for navigating between tabs.
d3.selectAll(".nav-item").on("click", function() {
  Page.current = d3.select(this).attr('data-target');
  d3.selectAll(".tab").style("display", "none");
  d3.select("#" + Page.current).style("display", "block");
  load_data();
});

/*
 * Loads data from JSON file and calls appropriate callbacks
 * to update and draw the appropriate data.
 */
function load_data(cbs) {
  if (Page.current == "general") {
    d3.json("output/welcome.json", function(error, data) {
      Psets.data = data;
      if (!cbs) {
        cbs = [histogram_comfort, draw_bar];
      }
      for (cb in cbs) { cbs[cb](); }
    });
  }

  else if (Page.current == "time") {
    d3.json("output/all.json", function(error, data) {
      Psets.data = data;
      removeOutliers(); // todo(ben): this should be done in aggregate function?
      if (!cbs) {
        cbs = [aggregate, draw_bar];
      }
      for (cb in cbs) { cbs[cb](); }
    });
  }
  else if (Page.current == "grades") {
    d3.json("output/grades.json", function(error, data) {
      Psets.data = data;
      if (!cbs) {
        cbs = [aggregate_grades, draw_bar];
      }
      for (cb in cbs) { cbs[cb](); }
    });
  }
}

load_data();
