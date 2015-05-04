/**
 * Grades Visualization
 * @param _parentElement -- the HTML or SVG element (D3 node) to which to attach the vis
 * @param _data -- the data array
 * @param _metaData -- the meta-data / data description object
 * @param _eventHandler -- the Eventhandling Object to emit data to
 * @constructor
 */
ComfortVis = function(_parentElement, _data, _metaData, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.metaData = _metaData;
    this.eventHandler = _eventHandler;
    this.displayData = [];
    this.filters = {};
    this.gradesDropdown = $("select#select-grades").val();
    this.piazzaDropdown = $("select#select-piazza").val();

    this.margin = {top: 10, right: 10, bottom: 35, left: 45},
    this.width = 400 - this.margin.left - this.margin.right,
    this.height = 300 - this.margin.top - this.margin.bottom;

    this.initVis();
}


/**
 * Method that sets up the SVG and the variables
 */
ComfortVis.prototype.initVis = function(){

    var that = this;

    // Create new SVG element
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    var domain = [];
    for (var i = 1; i <= 10; i++) {
      domain.push(i);
    }

    // creates axes and scales
    this.x = d3.scale.ordinal()
      .domain(domain)
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

    this.svg.append("text")
      .attr("class", "x label")
      .attr("x", that.width / 2)
      .attr("y", that.height + 30)
      .attr("text-anchor", "middle")
      .text("Comfort Level");

    this.svg.append("text")
        .attr("class", "y label")
        .attr("x", -1 * that.height / 2)
        .attr("y", -30)
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
ComfortVis.prototype.wrangleData = function(_filterFunction, _filterId) {

    var that = this;

    var filter = function() { return false; }
    if (_filterFunction != null) {
        filter = _filterFunction;
        if (that.filters[_filterId]) {
          delete that.filters[_filterId];
        }
        else {
          that.filters[_filterId] = filter;
        }
    }

    var data = this.data.map(function(d) {
      return d.comfort;
    });

    var counts = [];
    for (var i = 0; i < 10; i++) {
      counts[i] = 0;
    }

    for (var i in data) {
      counts[data[i] - 1] += 1;
    }

    this.displayData = counts;

    var filtered = this.data;

    if (isEmpty(this.filters)) {
      filtered = filtered.filter(function() { return false; });
    }
    else {
      filtered = multiFilter(filtered, that.filters);
    }

    var data2 = filtered.map(function(d) {
      return d.comfort;
    });

    var counts2 = [];
    for (var i = 0; i < 10; i++) {
      counts2[i] = 0;
    }

    for (var i in data2) {
      counts2[data2[i] - 1] += 1;
    }

    this.displayData2 = counts2;
}

/**
 * the drawing function - should use the D3 selection, enter, exit
 * @param _options -- only needed if different kinds of updates are needed
 */
ComfortVis.prototype.updateVis = function() {

    var that = this;

    this.svg.selectAll(".bar").remove();

    // Update scales with domains
    this.y.domain([0, d3.max(this.displayData, function(d) { return d; })]);

    var width = 25;

    var bar = this.svg.selectAll(".bar")
      .data(that.displayData)
      .enter().append("g")
      .attr("class", "bar")

    bar.append("rect")
      .attr("x", function(d, i) { return that.x(i + 1)})
      .attr("y", function(d) { return that.y(d) })
      .attr("width", width)
      .attr("height", function(d) { return that.height - that.y(d); })
      .attr("data-clicked", 0)
      .on("click", function(d, i) {
        var element = d3.select(this);
        var clicked = element.attr("data-clicked");
        if (clicked == 0) {
          element.style("fill", "#d73027");
        }
        else {
          element.style("fill", "black");
        }
        element.attr("data-clicked", 1 - clicked);
        $(that.eventHandler).trigger("comfortClick", {"id": i + 1, "comfort": i + 1});
      });

    var bar2 = this.svg.selectAll(".bar2")
      .data(that.displayData2)
      .enter().append("g")
      .attr("class", "bar")

    bar2.append("rect")
      .style("fill", "steelblue")
      .attr("x", function(d, i) { return that.x(i + 1)})
      .attr("y", function(d) { return that.y(d) })
      .attr("width", width)
      .attr("height", function(d) { return that.height - that.y(d); })
      .on("click", function(d) {
        $(that.eventHandler).trigger("comfortClick", {"id": i + 1, "comfort": i + 1});
      });

    // Update axes
    this.svg.select(".x.axis")
      .call(that.xAxis);

    this.svg.select(".y.axis")
      .call(that.yAxis)
}

ComfortVis.prototype.onSelectionChange = function (id, min, max) {

    var that = this;

    var filter = function(d) {
      return d.grades[that.gradesDropdown] >= min && d.grades[that.gradesDropdown] <= max;
    }

    this.wrangleData(filter, id);

    this.updateVis();
}

ComfortVis.prototype.onClassChange = function (id, classYear) {

    var that = this;

    var filter = function(d) {
      return d["class"] == classYear
    }

    this.wrangleData(filter, id);

    this.updateVis();
}

ComfortVis.prototype.onPiazzaChange = function (id, min, max) {

    var that = this;

    var filter = function(d) {
      return d.piazza[that.piazzaDropdown] >= min && d.piazza[that.piazzaDropdown] <= max;
    }

    this.wrangleData(filter, id);

    this.updateVis();
}
