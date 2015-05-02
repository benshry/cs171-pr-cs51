/**
 * Grades Visualization
 * @param _parentElement -- the HTML or SVG element (D3 node) to which to attach the vis
 * @param _data -- the data array
 * @param _metaData -- the meta-data / data description object
 * @param _eventHandler -- the Eventhandling Object to emit data to
 * @constructor
 */
PiazzaVis = function(_parentElement, _data, _metaData, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.metaData = _metaData;
    this.eventHandler = _eventHandler;
    this.displayData = [];
    this.filters = {};
    this.dropdown = $("select#select-piazza").val();
    this.gradesDropdown = $("select#select-grades").val();
    this.DOMAIN = {
      "views" : [0, 1200],
      "contributions" : [0, 230],
      "questions" : [0, 50],
      "answers" : [0, 180],
      "days" : [0, 70]
    }
    this.NAMES = {
      "views" : "Posts Viewed",
      "contributions" : "Contributions",
      "questions" : "Questions Asked",
      "answers" : "Questions Answered",
      "days" : "Days Online"
    }

    this.margin = {top: 10, right: 10, bottom: 30, left: 50},
    this.width = 400 - this.margin.left - this.margin.right,
    this.height = 300 - this.margin.top - this.margin.bottom;

    this.initVis();
}


/**
 * Method that sets up the SVG and the variables
 */
PiazzaVis.prototype.initVis = function(){

    var that = this;

    // Create new SVG element
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // creates axes and scales
    this.x = d3.scale.linear()
      .domain(that.DOMAIN[that.dropdown])
      .range([0, this.width]);

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
        .attr("transform", "translate(-10," + this.height + ")")

    this.svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(-10, 0)");

    this.svg.append("text")
      .attr("id", "axis-piazza")
      .attr("class", "x label")
      .attr("x", that.width / 2)
      .attr("y", that.height + 30)
      .attr("text-anchor", "middle")
      .text("Number of " + that.NAMES[that.dropdown]);

    this.svg.append("text")
      .attr("class", "y label")
      .attr("x", -1 * that.height / 2)
      .attr("y", -35)
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text("Number of Students");

    // filter, aggregate, modify data
    this.wrangleData();

    // call the update method
    this.updateVis();
}

/**
 * Method to wrangle the data.
 */
PiazzaVis.prototype.wrangleData = function(_filterFunction, _filterId) {

    var that = this;

    var filter = function() { return false; }
    if (_filterFunction != null){
        filter = _filterFunction;
        if (that.filters[_filterId]) {
          delete that.filters[_filterId];
        }
        else {
          that.filters[_filterId] = filter;
        }
    }

    // todo: starting with just midterm data
    var data = this.data.map(function(d) {
      return d.piazza[that.dropdown];
    });

    this.displayData = d3.layout.histogram()
      .bins(this.x.ticks(20))
      (data);

    var filtered = this.data;

    if (isEmpty(this.filters)) {
      filtered = filtered.filter(function() { return false; });
    }
    else {
      filtered = multiFilter(filtered, that.filters);
    }

    var data2 = filtered.map(function(d) {
      return d.piazza[that.dropdown];
    });

    this.displayData2 = d3.layout.histogram()
      .bins(this.x.ticks(20))
      (data2);
}

/**
 * the drawing function - should use the D3 selection, enter, exit
 * @param _options -- only needed if different kinds of updates are needed
 */
PiazzaVis.prototype.updateVis = function() {

    var that = this;

    this.svg.selectAll(".bar").remove();

    // Update scales with domains
    this.y.domain([0, d3.max(this.displayData, function(d) { return d.y; })]);

    var width = that.x(that.displayData[0].dx) - 1;

    var bar = this.svg.selectAll(".bar")
      .data(that.displayData)
      .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d) { return "translate(" + (that.x(d.x) - .5 * width) + "," + that.y(d.y) + ")"; });

    bar.append("rect")
      .attr("x", 1)
      .attr("width", width)
      .attr("height", function(d) { return that.height - that.y(d.y); })
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
        $(that.eventHandler).trigger("piazzaClick", {"id": d.x, "min": d.x, "max": d.x + d.dx});
      });

    var bar2 = this.svg.selectAll(".bar2")
      .data(that.displayData2)
      .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d) { return "translate(" + (that.x(d.x) - .5 * width) + "," + that.y(d.y) + ")"; });

    bar2.append("rect")
      .attr("x", 1)
      .attr("width", width)
      .attr("height", function(d) { return that.height - that.y(d.y); })
      .style("fill", "steelblue")
      .on("click", function(d) {
        $(that.eventHandler).trigger("piazzaClick", {"id": d.x, "min": d.x, "max": d.x + d.dx});
      });

    // Update axes
    this.svg.select(".x.axis")
      .call(that.xAxis);

    this.svg.select(".y.axis")
      .call(that.yAxis)
}

PiazzaVis.prototype.onSelectionChange = function (id, min, max) {

    var that = this;

    var filter = function(d) {
      return d.grades[that.gradesDropdown] >= min && d.grades[that.gradesDropdown] <= max;
    }

    this.wrangleData(filter, id);

    this.updateVis();
}

PiazzaVis.prototype.onComfortChange = function (id, comfort) {

    var that = this;

    var filter = function(d) {
      return d.comfort == comfort;
    }

    this.wrangleData(filter, id);

    this.updateVis();
}

PiazzaVis.prototype.onClassChange = function (id, classYear) {

    var that = this;

    var filter = function(d) {
      return d["class"] == classYear
    }

    this.wrangleData(filter, id);

    this.updateVis();
}
