function make_crime_concentration() {

    var crime_types = ["Property", "Society", "Violent", "Total"],
        ineq_types = ["Crime Gini coefficient", "Crime distribution"],
        ineq_properties = {
            "Crime Gini coefficient" : {csv_preprocess: csv_single_type_preprocess_gini
                                        },
            "Crime distribution"     : {csv_preprocess: csv_single_type_preprocess_concentration
                                        }
        };

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
    // end data preprocessing functions

    // bggin specialized helped functions
    function get_summary_table_value(csv_nest, crime_type, time_type, variable, field = "value") {
        
        var target_row = csv_nest[crime_type][time_type][variable];

        return target_row.length == 1 ? +target_row[0][field] : null; 
    }
    // end specialized helper functions

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
        .style("opacity", "0.4")
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
        .on("cellclick", function(d) {
            // get selected ineq_measure
            var selected_ineq = crime_type_g.selectAll(".legend_ordinal_ineq_type")
                .select(".legend_text_selected")
                .text();
            update_plot_type(d, selected_ineq)
        });

    crime_type_g.select(".legend_ordinal_crime_type")
        .call(legend_ordinal_crime_type);

    // set legend id
    crime_type_g.selectAll(".legend_ordinal_crime_type")
        .selectAll(".cell")
        .attr("id", d => get_crime_type_legend_id(d))

    // set line characteristics 
    crime_type_g.selectAll(".legend_ordinal_crime_type")
        .selectAll("line")
        .style("opacity", "0.4")
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

    initialize_plot(crime_types[crime_types.length - 1], ineq_types[ineq_types.length-1]);
    build_summary_table(crime_types[crime_types.length-1], ineq_types[ineq_types.length - 1]);

    function build_summary_table(type, ineq) {
        
        d3.csv("static/data/crimes_top_bot_25_endpoints.csv", function(csv_data) {
            
            var csv_nest = d3.nest()
                .key(d => d.crime_type)
                .key(d => d.time_type)
                .key(d => d.variable)
                .object(csv_data)

            // label the years
            d3.select("#tbl_top_bot_start_year")
                .text(get_summary_table_value(csv_nest, crime_types[0], "start", "crime_bot_avg", field = "year"));
            d3.select("#tbl_top_bot_end_year")
                .text(get_summary_table_value(csv_nest, crime_types[0], "endpoint", "crime_bot_avg", field = "year"));
           
            // fill in the table
            for(var i in crime_types) {
                var ct = crime_types[i];
                var top_crime_start = get_summary_table_value(csv_nest, ct, "start", "crime_top_avg"),
                    bot_crime_start = get_summary_table_value(csv_nest, ct, "start", "crime_bot_avg"),
                    top_crime_end   = get_summary_table_value(csv_nest, ct, "endpoint", "crime_top_avg"),
                    bot_crime_end   = get_summary_table_value(csv_nest, ct, "endpoint", "crime_bot_avg"),
                    gini_start      = get_summary_table_value(csv_nest, ct, "start", "gini_coefficient"),
                    gini_end        = get_summary_table_value(csv_nest, ct, "endpoint", "gini_coefficient");

                var crime_ratio_start = top_crime_start / bot_crime_start,
                    crime_ratio_end   = top_crime_end / bot_crime_end;

                function select_summary_table_text(gini_text, concentration_text) {
                    return {"Crime Gini coefficient" : gini_text, 
                            "Crime distribution"     : concentration_text
                           }[ineq];
                }

                function select_value_description() {
                    return {"Crime Gini coefficient" : "Crime Gini coefficients",
                            "Crime distribution"     : "Ratio of (crime in most severe 25%) to (crime in least severe 25%)"
                           }[ineq];
                }

                d3.select("#tbl_top_bot_value_description")
                    .text(select_value_description());

                d3.select("#top_bot_tbl_start")
                    .select("#" + ct + "_tbl_column")
                    .text(select_summary_table_text(
                        gini_start.toFixed(2),
                        crime_ratio_start.toFixed(1) + "x"
                    ));
                d3.select("#top_bot_tbl_endpoint")
                    .select("#" + ct + "_tbl_column")
                    .text(select_summary_table_text(
                        gini_end.toFixed(2),
                        crime_ratio_end.toFixed(1) + "x"
                    ));
                d3.select("#top_bot_tbl_change")
                    .select("#" + ct + "_tbl_column")
                    .text(select_summary_table_text(
                        (gini_end < gini_start ? "-" : "+") + Math.abs(gini_end - gini_start).toFixed(2),
                        (crime_ratio_end < crime_ratio_start ? "-" : "+") + Math.abs(crime_ratio_end-crime_ratio_start).toFixed(1) + "x"
                    ));

                // mouse interactions
                d3.selectAll("#" + ct + "_tbl_column")
                    .on("click", function(d) {
                        var type = d3.select(this).attr("id").split("_")[0];   
                        // get selected ineq_measure
                        var selected_ineq = crime_type_g.selectAll(".legend_ordinal_ineq_type")
                            .select(".legend_text_selected")
                            .text();
                        update_plot_type(type, selected_ineq);
                    })

            } 

        });

        update_summary_table_selection(type);

    }

    function update_summary_table_selection(type) {

        // set new colors
        crime_types.forEach(function(ct) {
            d3.selectAll("#" + ct + "_tbl_column")
                .transition()
                .style("background-color", function() {
                    var color = d3.color(z(type));
                    color.opacity = ct == type ? 0.2 : null;
                    return color;
                });
        });
    }

    // TODO: reference endpoints
    function make_autotext(type) {

        d3.csv("static/data/crimes_top_bot_25_endpoints.csv", function(csv_data) {
            
            var csv_nest = d3.nest()
                .key(d => d.crime_type)
                .key(d => d.time_type)
                .key(d => d.variable)
                .object(csv_data)

            // calcs for auto text below
            // TODO: break this up into smaller pieces
            var city_crime_type_desc = type == "Society" ? "<b>Crime against Society</b>" : "<b>" + type + "</b> crime",  
                area_crime_type_desc = (type == "Society" ? "rates of <b>crime against Society</b>" : "<b>" + type + "</b> crime"),
                // point lookups
                city_start = get_summary_table_value(csv_nest, type, "start", "chicago_crime"),
                high_start = get_summary_table_value(csv_nest, type, "start", "crime_top_avg"),
                low_start = get_summary_table_value(csv_nest, type, "start", "crime_bot_avg"),
                city_recent = get_summary_table_value(csv_nest, type, "recent", "chicago_crime"),
                high_recent = get_summary_table_value(csv_nest, type, "recent", "crime_top_avg"),
                low_recent = get_summary_table_value(csv_nest, type, "recent", "crime_bot_avg"),
                city_end= get_summary_table_value(csv_nest, type, "endpoint", "chicago_crime"),
                high_end = get_summary_table_value(csv_nest, type, "endpoint", "crime_top_avg"),
                low_end = get_summary_table_value(csv_nest, type, "endpoint", "crime_bot_avg"),
                // changes, ratios, and calculations
                high_low_ratio_start = (high_start / low_start).toFixed(1),
                high_low_ratio_end = (high_end / low_end).toFixed(1),
                value_change = Math.abs(high_low_ratio_end - high_low_ratio_start).toFixed(1),
                ratio_is_up = parseFloat(high_low_ratio_start) < parseFloat(high_low_ratio_end) ? "up" : "down",
                inequality_incr_decr = parseFloat(high_low_ratio_start) < parseFloat(high_low_ratio_end) ? "increased" : "decreased",
                // reductions
                city_reduction = "<b>" + Math.abs((city_end/city_start - 1)*100).toFixed(0) + "%</b>",
                low_reduction = "<b>" + Math.abs((low_end/low_start - 1)*100).toFixed(0) + "%</b>",
                // uptick
                city_recent_change_value = (city_end/city_recent - 1).toFixed(2),
                high_recent_change_value = (high_end/high_recent - 1).toFixed(2),
                low_recent_change_value = (low_end/low_recent - 1).toFixed(2),
                is_uptick = city_recent_change_value > 0.1,
                uptick_text = is_uptick ? 
                    "Despite this long-term decrease, Chicago is experiencing a recent uptick in " + city_crime_type_desc +
                    (high_recent_change_value > 1.25*city_recent_change_value ? ", particularly in <b>high</b> crime areas." : (
                     low_recent_change_value > 1.25*city_recent_change_value ? ", particularly in <b>low</b> crime areas." : ".")) : "",
                // misc embellishment
                start_year = get_summary_table_value(csv_nest, type, "start", "crime_bot_avg", field = "year"),
                high_reduction = "<b>" + Math.abs((high_end/high_start - 1)*100).toFixed(0) + "%</b>",
                low_high_red_compare = low_reduction > high_reduction ? "less significant" : "more pronounced";

            var autotext = 
                city_crime_type_desc + " throughout the city has decreased by " + city_reduction + " since " + start_year + ". " +
                uptick_text + " " +
                '<div style="line-height: 0.6em;"><br></div>' +
                "Presently, areas with high " + area_crime_type_desc + " experience <b>" + high_low_ratio_end + "x</b> " +
                (type == "Total" ? "the" : "this type of") + " crime as compared to low-crime areas. " + 
                "This inequality ratio is <b>" + ratio_is_up + " " + value_change + "x</b> since " +
                start_year + ". It has <b>" + inequality_incr_decr + "</b> because high-crime areas saw a crime reduction " +
                "of " + high_reduction + ", which is a <b>" + low_high_red_compare + "</b> decrease than the " + 
                low_reduction + " reduction experienced in low-crime areas."

            d3.select("#crime_top_bot_autotext_div")
                .html(autotext)

        })


    }

    function initialize_plot(type, ineq) {
    
        d3.csv("static/data/" + type + "_crimes_top_bot_25.csv", csv_single_type_preprocess_concentration, function(csv_data) {

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
                .style("opacity", (d, i) => i == 0 ? "1" : "0.4")
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

        update_ineq_type_legend(ineq);
        update_active_legend(type);
        make_autotext(type);
    }

    function update_ineq_type(ineq) {
        
        // get selected crime_type
        var selected_type = crime_type_g.selectAll(".legend_ordinal_crime_type")
            .select(".legend_text_selected")
            .text();

        // update ineq legend
        update_ineq_type_legend(ineq)
        
        // update plot type
        update_plot_type(selected_type, ineq);

        // update summary table
        build_summary_table(selected_type, ineq);
    }

    function update_plot_type(type, selected_ineq) {

        // Update data
        d3.csv("static/data/" + type + "_crimes_top_bot_25.csv", ineq_properties[selected_ineq].csv_preprocess, function(csv_data) {

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
                .style("opacity", (d, i) => i == 0 ? "1" : "0.4")
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

            // end plot each crime type over time
        });

        update_active_legend(type);
        update_summary_table_selection(type);
        make_autotext(type);

    }

    function update_ineq_type_legend(ineq) {

        var legendCells = crime_type_g.selectAll(".legend_ordinal_ineq_type").transition();
        var targetLegend = crime_type_g.selectAll("#" + get_ineq_type_legend_id(ineq)).transition();
        
        // dim all
        legendCells.selectAll("line")
            .style("opacity", "0.4");

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
            .style("opacity", "0.4");

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


