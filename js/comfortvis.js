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

    this.margin = {top: 10, right: 10, bottom: 20, left: 20},
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

    // creates axes and scales
    this.x = d3.scale.linear()
      .domain([0, 10])
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
ComfortVis.prototype.wrangleData = function() {

    // todo: starting with just midterm data
    var data = this.data.map(function(d) {
      return d.comfort;
    });

    this.displayData = d3.layout.histogram()
      .bins(this.x.ticks(10))
      (data);
}

/**
 * the drawing function - should use the D3 selection, enter, exit
 * @param _options -- only needed if different kinds of updates are needed
 */
ComfortVis.prototype.updateVis = function() {

    var that = this;

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
      .attr("height", function(d) { return that.height - that.y(d.y); });

    // Update axes
    this.svg.select(".x.axis")
      .call(that.xAxis);

    this.svg.select(".y.axis")
      .call(that.yAxis)
}
