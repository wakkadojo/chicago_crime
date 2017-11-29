
// For every column in the csv, create a timeseries of the value in the column
// This is similar to nest but allows time preprocessing (since nest will convert the time to a string)
function csv_timeseries_col_split(csv_data, cols_to_plot) {
    return Object.keys(csv_data[0]).filter(key => cols_to_plot.indexOf(key) >= 0).map(function(id) {
        return {
            id     : id,
            values : csv_data.map(function(d) { return { time : d.time, value : d[id] }; })
        };
    });
}

function add_tooltip(svg, x, y, text, id = null) {

    var x_buffer = 10;

    var tt = svg.append("g")
            .style("opacity", "0")
            .style("pointer-events", "none");

    if(id != null)
        tt.attr("id", id)

    var tt_background = tt.append("rect"), // placeholder
        tt_text = tt.append("text")
            .attr("alignment-baseline", "middle")
            .attr("transform", "translate(" + x + "," + y + ")")
            .attr("class", "d3tooltiptext")
            .html(text),
        bbox = tt.node().getBBox();

    // set background location
    tt_background
        .attr("x", bbox.x - x_buffer/3)
        .attr("y", bbox.y)
        .attr("width", bbox.width + x_buffer)
        .attr("height", bbox.height)
        .attr("fill", "white")
        .attr("opacity", "0.85");

    // fancy fade-in
    tt.transition().style("opacity", "1")

    return tt;
}
