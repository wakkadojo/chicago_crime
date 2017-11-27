function make_crime_concentration() {

    var crime_types = ["Property", "Society", "Violent", "Total"],
        ineq_types = ["Crime Gini coefficient", "Crime distribution"];

    var timeParse = d3.timeParse("%Y-%m");

    var crime_type_svg = d3.select("#crime_top_bot_timeseries_svg"),
        margin = {top: 100, right: 20, bottom: 60, left: 80},
        width = crime_type_svg.attr("width") - margin.left - margin.right,
        height = crime_type_svg.attr("height") - margin.top - margin.bottom,
        crime_type_g = crime_type_svg
            .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        z = d3.scaleOrdinal(d3.schemeCategory10);
   
    // static assignment 
    z.domain(crime_types);

    var line = d3.line()
        .x(d => x(d.time))
        .y(d => y(d.value));

    var get_crime_type_data_id = function(type) { return type + "_data_intensity_top_bot_id"; }
    var get_crime_type_legend_id = function(type) { return type + "_legend_intensity_top_bot_id"; }
    var get_ineq_type_legend_id = function(ineq) { return ineq.replace(/\W/g, '') + "_legend_ineq_type_id"; }
    
    // begin data preprocessing functions
    function csv_single_type_preprocess_concentration(d) {
        return {
            "time"                       : timeParse(d.time),
            "Chicago average"            : +d.chicago_crime,
            "Crime in most severe 25%"   : +d.crime_top_avg,
            "Crime in least severe 25%"  : +d.crime_bot_avg
        }
    }
    
    function csv_single_type_preprocess_gini(d) {
        return {
            "time"             : timeParse(d.time),
            "Gini coefficient" : +d.gini_coefficient
        }
    }

    // toggle preprocess variable
    var csv_single_type_preprocess = csv_single_type_preprocess_concentration;
    // end data preprocessing functions

    // Begin ineq type legend
    crime_type_g.append("g")
        .attr("class", "legend_ordinal_ineq_type");

    var scale_ordinal_ineq_type = d3.scaleOrdinal()
        .domain(ineq_types)
        .range(["black", "black"]);

    var legend_ordinal_ineq_type = d3.legendColor()
        .orient("horizontal")
        .labelOffset("-18")
        .shape("line")
        .shapePadding("2")
        .shapeWidth("202")
        .scale(scale_ordinal_ineq_type)
        .on("cellclick", d => update_ineq_type(d));

    crime_type_g.select(".legend_ordinal_ineq_type")
        .call(legend_ordinal_ineq_type);

    // set legend id
    crime_type_g.selectAll(".legend_ordinal_ineq_type")
        .selectAll(".cell")
        .attr("id", d => get_ineq_type_legend_id(d))

    // set line characteristics 
    crime_type_g.selectAll(".legend_ordinal_ineq_type")
        .selectAll("line")
        .style("opacity", "0.5")
        .style("stroke-width", "5")
    // style text
    crime_type_g.selectAll(".legend_ordinal_ineq_type")
        .selectAll("text")
        .attr("class", "d3axis")

    // set offset
    var legend_width_ineq_type = d3.select(".legend_ordinal_ineq_type").node().getBBox().width;

    crime_type_g.selectAll(".legend_ordinal_ineq_type")
        .attr("transform", "translate(" +  (width - legend_width_ineq_type)/2 + "," + -0.7*margin.top + ")")
    // End ineq type Legend

    // Begin crime type legend
    crime_type_g
        .append("g")
        .attr("class", "legend_ordinal_crime_type");

    var scale_ordinal_crime_type = d3.scaleOrdinal()
        .domain(z.domain())
        .range(z.range());

    var legend_ordinal_crime_type = d3.legendColor()
        .orient("horizontal")
        .labelOffset("-18")
        .shape("line")
        .shapePadding("2")
        .shapeWidth("100")
        .scale(scale_ordinal_crime_type)
        .on("cellclick", d => update_plot_type(d));

    crime_type_g.select(".legend_ordinal_crime_type")
        .call(legend_ordinal_crime_type);

    // set legend id
    crime_type_g.selectAll(".legend_ordinal_crime_type")
        .selectAll(".cell")
        .attr("id", d => get_crime_type_legend_id(d))

    // set line characteristics 
    crime_type_g.selectAll(".legend_ordinal_crime_type")
        .selectAll("line")
        .style("opacity", "0.5")
        .style("stroke-width", "5")

    // style text
    crime_type_g.selectAll(".legend_ordinal_crime_type")
        .selectAll("text")
        .attr("class", "d3axis")

    // set offset
    var legend_width_crime_type = d3.select(".legend_ordinal_crime_type").node().getBBox().width;

    crime_type_g.selectAll(".legend_ordinal_crime_type")
        .attr("transform", "translate(" +  (width - legend_width_crime_type)/2 + "," + -0.325*margin.top + ")")
    // End crime type Legend

    initialize_plot("Total");
    initialize_summary_table();

    function initialize_summary_table() {

        function get_value(csv_nest, crime_type, time_type, variable) {
            
            var target_row = csv_nest
                .filter(d => d.key == crime_type)[0].values // crime type search
                .filter(d => d.key == time_type)[0].values  // time type search
                .filter(d => d.key == variable)[0].values;  // variable search

            return target_row.length == 1 ? target_row[0] : null; 
        }
        
        d3.csv("static/data/crimes_top_bot_25_endpoints.csv", function(csv_data) {
            
            var csv_nest = d3.nest()
                .key(d => d.crime_type)
                .key(d => d.time_type)
                .key(d => d.variable)
                .entries(csv_data)

            // label the years
            d3.select("#tbl_top_bot_start_year")
                .text(get_value(csv_nest, crime_types[0], "start", "crime_bot_avg").year);
            d3.select("#tbl_top_bot_end_year")
                .text(get_value(csv_nest, crime_types[0], "endpoint", "crime_bot_avg").year);
           
            // fill in the table
            for(var i in crime_types) {
                var ct = crime_types[i];
                var top_crime_start = get_value(csv_nest, ct, "start", "crime_top_avg").value,
                    bot_crime_start = get_value(csv_nest, ct, "start", "crime_bot_avg").value,
                    top_crime_end   = get_value(csv_nest, ct, "endpoint", "crime_top_avg").value,
                    bot_crime_end   = get_value(csv_nest, ct, "endpoint", "crime_bot_avg").value;

                var crime_ratio_start = top_crime_start / bot_crime_start,
                    crime_ratio_end   = top_crime_end / bot_crime_end;

                d3.select("#top_bot_tbl_start")
                    .select("#" + ct + "_tbl_column")
                    .text(crime_ratio_start.toFixed(1) + "x");
                d3.select("#top_bot_tbl_endpoint")
                    .select("#" + ct + "_tbl_column")
                    .text(crime_ratio_end.toFixed(1) + "x");
                d3.select("#top_bot_tbl_change")
                    .select("#" + ct + "_tbl_column")
                    .text(
                        (crime_ratio_end < crime_ratio_start ? "-" : "+") + 
                        Math.abs(crime_ratio_end.toFixed(1) - crime_ratio_start.toFixed(1)).toFixed(1) + "x"
                    );

                // mouse interactions
                d3.selectAll("#" + ct + "_tbl_column")
                    .on("click", function(d) {
                        var type = d3.select(this).attr("id").split("_")[0];   
                        update_plot_type(type);
                    })

            } 

        });

        update_summary_table("Total");

    }

    function update_summary_table(type) {

        // reset color
        d3.selectAll("#crime_top_bot_summary_tbl")
            .selectAll("th")
            .style("background-color", null);
        d3.selectAll("#crime_top_bot_summary_tbl")
            .selectAll("td")
            .style("background-color", null);

        // set new color
        d3.selectAll("#" + type + "_tbl_column")
            .transition()
            .style("background-color", function() {
                var color = d3.color(z(type));
                color.opacity = 0.2;
                return color;
            });
    }

    // TODO: reference endpoints
    function make_auto_text(csv_data, type) {

        var crime_change_arr = csv_data.map(function(d) {
            return {
                id     : d.id,
                values : {
                    start_year   : d.values[0].time.getFullYear(),
                    value_start  : d.values[0].value,
                    value_end    : d.values[d.values.length - 1].value,
                    change_ratio : d.values[d.values.length - 1].value/d.values[0].value - 1.0
                }
            }
        });

        var crime_change = {}
        crime_change_arr.forEach(function(d) {
            crime_change[d.id] = d.values;
        });

        // calcs for auto text below
        var crime_type_description = (type == "Society" ? "rates of crime against Society" : type + " crime"),
            high_low_ratio_start = (crime_change["Crime in most severe 25%"].value_start / crime_change["Crime in least severe 25%"].value_start).toFixed(1),
            high_low_ratio_end = (crime_change["Crime in most severe 25%"].value_end / crime_change["Crime in least severe 25%"].value_end).toFixed(1),
            value_change = Math.abs(high_low_ratio_end - high_low_ratio_start).toFixed(1),
            ratio_is_up = parseFloat(high_low_ratio_start) < parseFloat(high_low_ratio_end) ? "up" : "down",
            inequality_incr_decr = parseFloat(high_low_ratio_start) < parseFloat(high_low_ratio_end) ? "increase" : "decrease",
            start_year = crime_change["Crime in most severe 25%"].start_year,
            low_reduction = Math.abs(crime_change["Crime in least severe 25%"].change_ratio*100).toFixed(0) + "%",
            high_reduction = Math.abs(crime_change["Crime in most severe 25%"].change_ratio*100).toFixed(0) + "%",
            low_high_red_compare = low_reduction < high_reduction ? "less significant" : "more pronounced";

        var auto_text = 
            "Areas with high <b>" + crime_type_description + "</b> experience <b>" + high_low_ratio_end + "x</b> " +
            "the crime as low crime areas. Inequality between the worst and best areas is <b>" + ratio_is_up + " " + value_change + "x</b> from " +
            start_year + ". This <b>" + inequality_incr_decr + "</b> is because low crime areas saw a crime reduction " +
            "of <b>" + low_reduction + "</b>, which is a <b>" + low_high_red_compare + "</b> decrease than the " + 
            "<b>" + high_reduction + "</b> reduction  seen in high crime areas."

        return auto_text;

    }

    function initialize_plot(type) {
    
        d3.csv("static/data/" + type + "_crimes_top_bot_25.csv", csv_single_type_preprocess, function(csv_data) {

            var cols_to_plot = Object.keys(csv_data[0]).filter(d => d != "time")
            csv_data = csv_timeseries_col_split(csv_data, cols_to_plot);

            x.domain(d3.extent(csv_data[0].values.map(d => d.time)));
            // if only one line, zoom in on it
            if(csv_data.length < 2)
                y.domain(d3.extent(csv_data[0].values.map(d => d.value))).nice();
            else
                y.domain([0, d3.max(csv_data.map(d => d3.max(d.values.map(col => col.value))))]);

            // Begin make axes
            crime_type_g.append("g")
                .attr("class", "d3axis")
                .attr("id", "plot_x_axis")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x))
                .append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" + (width/2.0) + "," + 40 + ")")
                .attr("fill", "black")
                .text("time");
           
            crime_type_g.append("g")
                .attr("class", "d3axis")
                .attr("id", "plot_y_axis")
                .call(d3.axisLeft(y).ticks(5))
                .append("text")
                .attr("text-anchor", "middle")
                .attr("y", -2*margin.left/3)
                .attr("x", -height/2)
                .attr("transform", "rotate(-90)")
                .attr("fill", "black")
                .attr("id", "plot_y_axis_label")
                .text("Crime intensity");
            // End make axes

            // auto text
            //d3.select("#crime_top_bot_autotext_div")
            //    .html(make_auto_text(csv_data, type))

            // begin plot each crime type over time
            crime_type_g.append("g")
                .attr("id", "crime_type_top_bot_path")
                .selectAll("path")
                .data(csv_data)
                .enter()
                .append("path")
                .attr("d", d => line(d.values))
                .attr("fill", "none")
                .attr("stroke", z(type))
                .style("opacity", d => d.id == "Chicago average" ? "1" : "0.4")
                .style("stroke-width", "2");

            // labels
            crime_type_g.append("g")
                .attr("id", "crime_type_top_bot_text")
                .selectAll("text")
                .data(csv_data)
                .enter()
                .append("text")
                .attr("transform", d => "translate(6," + (y(d.values[0].value) + 16) + ")")
                .attr("fill", "black")
                .attr("class", "d3axis")
                .text(d => d.id);

            // end plot each crime type over time
        });

        update_ineq_type_legend(ineq_types[ineq_types.length - 1]);
        update_active_legend(type);
    }

    function update_ineq_type(ineq) {
        
        // get selected crime_type
        var selected_type = crime_type_g.selectAll(".legend_ordinal_crime_type")
            .select(".legend_text_selected")
            .text();

        // update preprocessing function
        if(ineq == "Crime distribution")
            csv_single_type_preprocess = csv_single_type_preprocess_concentration;
        else if(ineq == "Crime Gini coefficient")
            csv_single_type_preprocess = csv_single_type_preprocess_gini;
        // else nothing
        
        // update plot type
        update_plot_type(selected_type);

        // update ineq legend
        update_ineq_type_legend(ineq)
    }

    function update_plot_type(type) {

        // Update data
        d3.csv("static/data/" + type + "_crimes_top_bot_25.csv", csv_single_type_preprocess, function(csv_data) {

            var cols_to_plot = Object.keys(csv_data[0]).filter(d => d != "time")
            csv_data = csv_timeseries_col_split(csv_data, cols_to_plot);
            
            x.domain(d3.extent(csv_data[0].values.map(d => d.time)));
            // if only one line, zoom in on it
            if(csv_data.length < 2)
                y.domain(d3.extent(csv_data[0].values.map(d => d.value))).nice();
            else
                y.domain([0, d3.max(csv_data.map(d => d3.max(d.values.map(col => col.value))))]);

            // Begin make axes
            crime_type_g.select("#plot_x_axis")
                .transition()
                .call(d3.axisBottom(x))
          
            // y axis name: if only one variable, use it, otherwise assume it's crime 
            crime_type_g.select("#plot_y_axis")
                .transition()
                .call(d3.axisLeft(y).ticks(5))
            crime_type_g.select("#plot_y_axis_label")
                .transition()
                .text(csv_data.length > 1 ? "Crime intensity" : csv_data[0].id);

            // End make axes
            
            // begin plot each crime type over time
            var svg_temp_path = crime_type_g
                .selectAll("#crime_type_top_bot_path")
                .selectAll("path")
                .data(csv_data);

            svg_temp_path.enter()
                .append("path")
                .merge(svg_temp_path)
                .transition()
                .attr("d", d => line(d.values))
                .attr("fill", "none")
                .attr("stroke", z(type))
                .style("opacity", d => d.id == "Chicago average" ? "1" : "0.4")
                .style("stroke-width", "2");

            svg_temp_path.exit().remove();
           
            // labels if length is nontrivial
            var svg_temp_text = crime_type_g
                .selectAll("#crime_type_top_bot_text")
                .selectAll("text")
                .data(csv_data.length > 1 ? csv_data : []);

            svg_temp_text.enter()
                .append("text")
                .merge(svg_temp_text)
                .transition()
                .attr("transform", d => "translate(6," + (y(d.values[0].value) + 16) + ")")
                .attr("fill", "black")
                .attr("class", "d3axis")
                .text(d => d.id);

            svg_temp_text.exit().remove();

            // begin make auto text
            //d3.select("#crime_top_bot_autotext_div")
            //    .html(make_auto_text(csv_data, type))

            // end plot each crime type over time
        });

        update_active_legend(type);
        update_summary_table(type);

    }

    function update_ineq_type_legend(ineq) {

        var legendCells = crime_type_g.selectAll(".legend_ordinal_ineq_type").transition();
        var targetLegend = crime_type_g.selectAll("#" + get_ineq_type_legend_id(ineq)).transition();
        
        // dim all
        legendCells.selectAll("line")
            .style("opacity", "0.5");

        // text to normal
        legendCells.selectAll("text")
            .attr("class", "d3axis");

        // Darken the selected
        targetLegend.selectAll("line")
            .style("opacity", null);

        // Bold the selected
        targetLegend.selectAll("text")
            .attr("class", "legend_text_selected d3axis");

    }

    function update_active_legend(type) {
        
        var legendCells = crime_type_g.selectAll(".legend_ordinal_crime_type").transition();
        var targetLegend = crime_type_g.selectAll("#" + get_crime_type_legend_id(type)).transition();
        
        // dim all
        legendCells.selectAll("line")
            .style("opacity", "0.5");

        // text to normal
        legendCells.selectAll("text")
            .attr("class", "d3axis");

        // Darken the selected
        targetLegend.selectAll("line")
            .style("opacity", null);

        // Bold the selected
        targetLegend.selectAll("text")
            .attr("class", "legend_text_selected d3axis");
    }

}

make_crime_concentration();


