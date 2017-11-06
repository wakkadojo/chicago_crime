function make_crime_concentration() {

    var timeParse = d3.timeParse("%Y-%m");

    var cols_crime_level_plot = new Set(["High crime areas", "Chicago avg", "Low crime areas"]);

    function csv_preprocess(d) {
        return {
            "time"                : timeParse(d.time),
            "High crime areas"    : +d.crime_top_avg,
            "Low crime areas"     : +d.crime_bot_avg,
            "Chicago avg"         : +d.chicago_crime
        }
    }

    var crime_type_svg = d3.select("#crime_top_bot_timeseries_svg"),
        margin = {top: 50, right: 20, bottom: 60, left: 110},
        width = crime_type_svg.attr("width") - margin.left - margin.right,
        height = crime_type_svg.attr("height") - margin.top - margin.bottom,
        crime_type_g = crime_type_svg
            .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        z = d3.scaleOrdinal(d3.schemeCategory10);
   
    // static assignment 
    z.domain(['Property', 'Society', 'Violent', 'Total']);

    var line = d3.line()
        .x(d => x(d.time))
        .y(d => y(d.value));

    var get_crime_type_data_id = function(type) { return type + "_data_intensity_top_bot_id"; }
    var get_crime_type_legend_id = function(type) { return type + "_legend_intensity_top_bot_id"; }
    

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

    initialize_plot_type("Total");

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
        var crime_type_description = (type == "Society" ? "rate of crime against Society" : type + " crime"),
            high_low_ratio_start = (crime_change["High crime areas"].value_start / crime_change["Low crime areas"].value_start).toFixed(1),
            high_low_ratio_end = (crime_change["High crime areas"].value_end / crime_change["Low crime areas"].value_end).toFixed(1),
            value_change = Math.abs(high_low_ratio_end - high_low_ratio_start).toFixed(1),
            ratio_is_up = high_low_ratio_start < high_low_ratio_end ? "up" : "down",
            inequality_incr_decr = high_low_ratio_start < high_low_ratio_end ? "increase" : "decrease",
            start_year = crime_change["High crime areas"].start_year,
            low_reduction = Math.abs(crime_change["Low crime areas"].change_ratio*100).toFixed(0) + "%",
            high_reduction = Math.abs(crime_change["High crime areas"].change_ratio*100).toFixed(0) + "%",
            low_high_red_compare = low_reduction < high_reduction ? "less significant" : "more significant";

        var auto_text = 
            "Areas with high <b>" + crime_type_description + "</b> experience <b>" + high_low_ratio_end + "x</b> " +
            "the crime as low crime areas. This inequality is <b>" + ratio_is_up + " " + value_change + "x</b> from " +
            start_year + ". This <b>" + inequality_incr_decr + "</b> is because low crime areas saw a crime reduction of " +
            "<b>" + low_reduction + "</b>, which is a <b>" + low_high_red_compare + "</b> decrease than the " + 
            "<b>" + high_reduction + "</b> reduction  seen in high crime areas."

        return auto_text;

    }

    function initialize_plot_type(type) {
    
        d3.csv("static/data/" + type + "_crimes_top_bot_25.csv", csv_preprocess, function(csv_data) {

            csv_data = csv_timeseries_col_split(csv_data, cols_crime_level_plot);

            x.domain(d3.extent(csv_data[0].values.map(d => d.time)));
            y.domain([0, d3.max(csv_data.map(d => d3.max(d.values.map(col => col.value))))]);

            // Begin make axes
            crime_type_g.append("g")
                .attr("class", "d3axis")
                .attr("id", "crime_type_top_bot_25_x_axis")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x))
                .append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" + (width/2.0) + "," + 40 + ")")
                .attr("fill", "black")
                .text("time");
           
            crime_type_g.append("g")
                .attr("class", "d3axis")
                .attr("id", "crime_type_top_bot_25_y_axis")
                .call(d3.axisLeft(y).ticks(5))
                .append("text")
                .attr("text-anchor", "middle")
                .attr("y", -margin.left/2)
                .attr("x", -height/2)
                .attr("transform", "rotate(-90)")
                .attr("fill", "black")
                .text("Crime intensity");
            // End make axes

            // auto text
            d3.select("#crime_top_bot_autotext_div")
                .html(make_auto_text(csv_data, type))

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
                .style("opacity", d => d.id == "Chicago avg" ? "1" : "0.4")
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

        update_active_legend(type);
    }

    function update_plot_type(type) {

        // Update data
        d3.csv("static/data/" + type + "_crimes_top_bot_25.csv", csv_preprocess, function(csv_data) {

            csv_data = csv_timeseries_col_split(csv_data, cols_crime_level_plot);
            
            x.domain(d3.extent(csv_data[0].values.map(d => d.time)));
            y.domain([0, d3.max(csv_data.map(d => d3.max(d.values.map(col => col.value))))]);

            // Begin make axes
            crime_type_g.select("#crime_type_top_bot_25_x_axis")
                .transition()
                .call(d3.axisBottom(x))
           
            crime_type_g.select("#crime_type_top_bot_25_y_axis")
                .transition()
                .call(d3.axisLeft(y).ticks(5))
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
                .style("opacity", d => d.id == "Chicago avg" ? "1" : "0.4")
                .style("stroke-width", "2");

            svg_temp_path.exit().remove();
           
            // labels 
            var svg_temp_text = crime_type_g
                .selectAll("#crime_type_top_bot_text")
                .selectAll("text")
                .data(csv_data);

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
            d3.select("#crime_top_bot_autotext_div")
                .html(make_auto_text(csv_data, type))

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


