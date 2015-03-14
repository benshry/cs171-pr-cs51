var Svg = {}
Svg.margin = {top: 50, bottom: 50, left:50, right: 50};
Svg.width = 600 - Svg.margin.left - Svg.margin.right;
Svg.height = 500 - Svg.margin.top - Svg.margin.bottom;
Svg.bar_padding = 10;
Svg.bar_width = -1;

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

  Svg.xScale = d3.scale.ordinal().rangeRoundBands([0, Svg.width], 0.5, 0);
  Svg.yScale = d3.scale.linear().range([0, Svg.height]);


  Svg.svg = d3.select("body").append("svg")
              .attr("width", Svg.width + Svg.margin.left + Svg.margin.right)
              .attr("height", Svg.height + Svg.margin.top + Svg.margin.bottom);

  Svg.g = Svg.svg.append("g")
              .attr("transform", "translate(" + Svg.margin.left + "," + Svg.margin.top + ")");
}

var draw = function() {

  resetSvg();

  var min = 0;
  var max = d3.max(Psets.data, function(d) { return d.minutes; } );

  Svg.xScale.domain(Psets.data.map(function(d) { return d.pset; }));
  Svg.yScale.domain([min, max]);

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
    .attr("y", function(d) { return Svg.height - Svg.yScale(d.minutes) + Svg.margin.top });

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

  // filter out other psets
  Psets.data = Psets.data.filter(function(d) {
    return d.file == Psets.current;
  });

  Svg.xScale = d3.scale.linear()
    .domain([0, d3.max(Psets.data, function(d) { return d.minutes; })])
    .range([0, Svg.width]);

  var layout = d3.layout.histogram()
    .bins(Svg.xScale.ticks(10))
    (Psets.data.map(function(d) { return d.minutes; }));

  Svg.yScale = d3.scale.linear()
    .domain([0, d3.max(layout, function(d) {return d.y})])
    .range([Svg.height, 0]);

  var xAxis = d3.svg.axis()
    .scale(Svg.xScale)
    .orient("bottom");

  d3.select('svg').remove();

  Svg.svg = d3.select("body").append("svg")
              .attr("width", Svg.width + Svg.margin.left + Svg.margin.right)
              .attr("height", Svg.height + Svg.margin.top + Svg.margin.bottom);

  Svg.g = Svg.svg.append("g")
              .attr("transform", "translate(" + Svg.margin.left + "," + Svg.margin.top + ")");

  var bars = Svg.g.append("g")
    .selectAll("g.bar")
    .data(layout)
    .enter()
    .append("g")
    .attr("class", "bar")
    .attr("transform", function(d) {return "translate(" + Svg.xScale(d.x) + "," + Svg.yScale(d.y) + ")"; });

  bars.append("rect")
    .attr("x", 1)
    .attr("width", Svg.xScale(layout[0].dx) - 1)
    .attr("height", function(d) { return Svg.height - Svg.yScale(d.y); });

  bars.append("text")
    .attr("dy", ".75em")
    .attr("y", 6)
    .attr("x", Svg.xScale(layout[0].dx) / 2)
    .attr("text-anchor", "middle")
    .text(function(d) { return d.y; });

  Svg.svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + Svg.margin.left + "," + (Svg.height + Svg.margin.bottom) + ")")
    .call(xAxis);

  d3.selectAll(".tick text").style('font-size', '10px');

}

d3.select("select#select-time").on("change", function() {
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
