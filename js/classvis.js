/**
 * Grades Visualization
 * @param _parentElement -- the HTML or SVG element (D3 node) to which to attach the vis
 * @param _data -- the data array
 * @param _metaData -- the meta-data / data description object
 * @param _eventHandler -- the Eventhandling Object to emit data to
 * @constructor
 */
ClassVis = function(_parentElement, _data, _metaData, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.metaData = _metaData;
    this.eventHandler = _eventHandler;
    this.displayData = [];
    this.filters = {};
    this.gradesDropdown = $("select#select-grades").val();

    this.margin = {top: 10, right: 20, bottom: 20, left: 30},
    this.width = 400 - this.margin.left - this.margin.right,
    this.height = 300 - this.margin.top - this.margin.bottom;

    this.initVis();
}


/**
 * Method that sets up the SVG and the variables
 */
ClassVis.prototype.initVis = function(){

    var that = this;

    // Create new SVG element
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // creates axes and scales
    this.x = d3.scale.ordinal()
      .domain(["2015", "2016", "2017", "2018", "Extension School"])
      .rangeRoundBands([0, this.width], 0.5, 0);

    this.y = d3.scale.linear()
      .range([this.height, 0]);

    this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .orient("left");

    // Add axes visual elements
    this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")")

    this.svg.append("g")
        .attr("class", "y axis")

    // filter, aggregate, modify data
    this.wrangleData();

    // call the update method
    this.updateVis();
}

/**
 * Method to wrangle the data.
 */
ClassVis.prototype.wrangleData = function(_filterFunction, _filterId) {

    var that = this;

    // Remove the 1 student that doesn't fall into one of the below categories
    this.data = this.data.filter(function(d) {
      return ($.inArray(d["class"], ["2015", "2016", "2017", "2018", "Extension School"]) != -1);
    });

    /* todo: remove this code from each file? */
    var filter = function(){return false;}
    if (_filterFunction != null){
        filter = _filterFunction;
        if (that.filters[_filterId]) {
          delete that.filters[_filterId];
        }
        else {
          that.filters[_filterId] = filter;
        }
    }

    this.displayData = [
      { "class": "2015", "number": (this.data.filter( function(d) { return d["class"] == "2015" }).length )},
      { "class": "2016", "number": (this.data.filter( function(d) { return d["class"] == "2016" }).length )},
      { "class": "2017", "number": (this.data.filter( function(d) { return d["class"] == "2017" }).length )},
      { "class": "2018", "number": (this.data.filter( function(d) { return d["class"] == "2018" }).length )},
      { "class": "Extension School", "number": (this.data.filter( function(d) { return d["class"] == "Extension School" }).length )},
    ];

    var filtered = this.data;

    if (isEmpty(this.filters)) {
      filtered = filtered.filter(function() { return false; });
    }
    else {
      filtered = multiFilter(filtered, that.filters);
    }

    this.displayData2 = [
      { "class": "2015", "number": (filtered.filter( function(d) { return d["class"] == "2015" }).length )},
      { "class": "2016", "number": (filtered.filter( function(d) { return d["class"] == "2016" }).length )},
      { "class": "2017", "number": (filtered.filter( function(d) { return d["class"] == "2017" }).length )},
      { "class": "2018", "number": (filtered.filter( function(d) { return d["class"] == "2018" }).length )},
      { "class": "Extension School", "number": (filtered.filter( function(d) { return d["class"] == "Extension School" }).length )},
    ];
}

/**
 * the drawing function - should use the D3 selection, enter, exit
 * @param _options -- only needed if different kinds of updates are needed
 */
ClassVis.prototype.updateVis = function() {

    var that = this;

    this.svg.selectAll(".bar").remove();

    // Update scales with domains
    this.y.domain([0, d3.max(this.displayData, function(d) { return d["number"]; })]);

    // var width = this.width / this.displayData.length - 1;
    var width = 25;

    var bar = this.svg.selectAll(".bar")
      .data(that.displayData)
      .enter().append("g")
      .attr("class", "bar")

    bar.append("rect")
      .attr("x", function(d) { return that.x(d["class"]) + 5 })
      .attr("y", function(d) { return that.y(d["number"]) })
      .attr("width", width)
      .attr("height", function(d) { return that.height - that.y(d["number"]); })
      .attr("data-clicked", 0)
      .on("click", function(d) {
        var element = d3.select(this);
        var clicked = element.attr("data-clicked");
        if (clicked == 0) {
          element.style("fill", "#d73027");
        }
        else {
          element.style("fill", "black");
        }
        element.attr("data-clicked", 1 - clicked);
        $(that.eventHandler).trigger("classClick", {"id": d["class"], "class": d["class"]});
      });

    var bar2 = this.svg.selectAll(".bar2")
      .data(that.displayData2)
      .enter().append("g")
      .attr("class", "bar")

    bar2.append("rect")
      .attr("x", function(d) { return that.x(d["class"]) + 5 })
      .attr("y", function(d) { return that.y(d["number"]) })
      .attr("width", width)
      .attr("height", function(d) { return that.height - that.y(d["number"]); })
      .style("fill", "steelblue")
      .on("click", function(d) {
        $(that.eventHandler).trigger("classClick", {"id": d["class"], "class": d["class"]});
      });

    // Update axes
    this.svg.select(".x.axis")
      .call(that.xAxis);

    this.svg.select(".y.axis")
      .call(that.yAxis)
}

ClassVis.prototype.onSelectionChange = function (id, min, max) {

    var that = this;

    var filter = function(d) {
      return d.grades[that.gradesDropdown] >= min && d.grades[that.gradesDropdown] <= max;
    }

    this.wrangleData(filter, id);

    this.updateVis();
}

ClassVis.prototype.onComfortChange = function (id, comfort) {

    var that = this;

    var filter = function(d) {
      return d.comfort == comfort;
    }

    this.wrangleData(filter, id);

    this.updateVis();
}
