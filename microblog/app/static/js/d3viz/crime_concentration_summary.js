function make_crime_concentration() {

    var crime_type_svg = d3.select("#crime_worst_pct_svg"),
        margin = {top: 50, right: 20, bottom: 60, left: 110},
        width = crime_type_svg.attr("width") - margin.left - margin.right,
        height = crime_type_svg.attr("height") - margin.top - margin.bottom,
        crime_type_g = crime_type_svg
            .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        z = d3.scaleOrdinal(d3.schemeCategory10);        

    var line = d3.line()
        .x(d => x(d.time))
        .y(d => y(d.top_bot_crime_ratio));
        
    var timeParse = d3.timeParse("%Y-%m");

    var get_crime_type_data_id = function(type) { return type + "_data_intensity_ratio_id"; }
    var get_crime_type_legend_id = function(type) { return type + "_legend_intensity_ratio_id"; }
    
    // Begin static assignments
    z.domain(['Property', 'Society', 'Violent', 'Total']);

    // Begin legend
    crime_type_g
        .append("g")
        .attr("class", "legend_ordinal");

    var scale_ordinal = d3.scaleOrdinal()
        .domain(z.domain())
        .range(z.range());

    var legend_ordinal = d3.legendColor()
        .orient("horizontal")
        .labelOffset("-18")
        .shape("line")
        .shapeWidth("80")
        .scale(scale_ordinal)
        .on("cellclick", d => update_plot_type(d));

    crime_type_g.select(".legend_ordinal")
        .attr("class", "d3axis")
        .call(legend_ordinal);

    // set legend id
    crime_type_g.selectAll(".legendCells")
        .selectAll(".cell")
        .attr("id", d => get_crime_type_legend_id(d))

    // set line characteristics
    crime_type_g.selectAll(".legendCells")
        .selectAll("line")
        .style("opacity", "0.5")
        .style("stroke-width", "5")

    // set offset
    var legend_width = d3.select(".legendCells").node().getBBox().width;

    crime_type_g.selectAll(".legendCells")
        .attr("transform", "translate(" +  (width - legend_width)/2 + "," + -margin.top/2 + ")")
    // End Legend
    // End static assignments

    first_plot_type("Total");

    function first_plot_type(type) {
    
        d3.csv("static/data/" + type + "_crimes_top_bot_20.csv", function(csv_data) {
            
            csv_data.forEach(function(row) { 
                row.time = timeParse(row.time);
                row.top_bot_crime_ratio = +row.top_bot_crime_ratio;
            })

            x.domain(d3.extent(csv_data.map(d => d.time)))
            y.domain(d3.extent(csv_data.map(d => d.top_bot_crime_ratio)));

            // Begin make axes
            crime_type_g.append("g")
                .attr("class", "d3axis")
                .attr("id", "crime_type_top_bot_20_x_axis")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x))
                .append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" + (width/2.0) + "," + 2*margin.bottom/3 + ")")
                .attr("fill", "black")
                .text("time");
           
            crime_type_g.append("g")
                .attr("class", "d3axis")
                .attr("id", "crime_type_top_bot_20_y_axis")
                .call(d3.axisLeft(y).ticks(5))
                .append("text")
                .attr("text-anchor", "middle")
                .attr("y", -margin.left/2)
                .attr("x", -height/2)
                .attr("transform", "rotate(-90)")
                .attr("fill", "black")
                .text("Worst quintile / best quintile");
            // End make axes
            
            // begin plot each crime type over time
            crime_type_g.selectAll("svg")
                .data([csv_data])
                .enter()
                .append("g")
                .attr("id", "crime_type_top_bot_20_path")
                .append("path")
                .attr("d", d => line(d))
                .attr("fill", "none")
                .attr("stroke", z(type))
                .style("stroke-width", "2");

            // end plot each crime type over time
        });

        update_active_legend(type);
    }

    function update_plot_type(type) {

        // Update data
        d3.csv("static/data/" + type + "_crimes_top_bot_20.csv", function(csv_data) {
            
            csv_data.forEach(function(row) { 
                row.time = timeParse(row.time);
                row.top_bot_crime_ratio = +row.top_bot_crime_ratio;
            })

            x.domain(d3.extent(csv_data.map(d => d.time)))
            y.domain(d3.extent(csv_data.map(d => d.top_bot_crime_ratio)));

            // Begin make axes
            crime_type_g.select("#crime_type_top_bot_20_x_axis")
                .transition()
                .call(d3.axisBottom(x))
           
            crime_type_g.select("#crime_type_top_bot_20_y_axis")
                .transition()
                .call(d3.axisLeft(y).ticks(5))
            // End make axes
            
            // begin plot each crime type over time
            var svg_temp = crime_type_g
                .select("#crime_type_top_bot_20_path")
                .select("path")
                .data([csv_data])
                .transition()

            svg_temp.attr("d", d => line(d))
                .attr("stroke", z(type));

            // end plot each crime type over time
        });

        update_active_legend(type);

    }

    function update_active_legend(type) {
        
        var legendCells = crime_type_g.selectAll(".legendCells").transition();
        var targetLegend = crime_type_g.selectAll("#" + get_crime_type_legend_id(type)).transition();
        
        // dim all
        legendCells.selectAll("line")
            .style("opacity", "0.5");

        // text to normal
        legendCells.selectAll("text")
            .style("font-weight", null);

        // Darken the selected
        targetLegend.selectAll("line")
            .style("opacity", "1");

        // Bold the selected
        targetLegend.selectAll("text")
            .style("font-weight", "bold");
    }

}

make_crime_concentration();


