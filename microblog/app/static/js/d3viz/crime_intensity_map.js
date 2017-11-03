function explore_city_container() {

    var chi_map_int_svg = d3.select("#crime_chi_map_int_svg"),
        map_margin = {top: 60, right: 60},
        map_width = chi_map_int_svg.attr("width") - map_margin.right,
        map_height = chi_map_int_svg.attr("height") - map_margin.top;

    var map_color = d3.scaleSequential(d3.interpolateBlues);
    var color_saturate_factor = 0.75;

    // Begin map 2002/2017 selection
    function get_map_button_id(year) { return "map_button_" + year + "_id"; }

    chi_map_int_svg
        .append("g")
        .attr("class", "button_map");
    var map_button_scale_ordinal = d3.scaleOrdinal()
        .domain(["2002", "2017"])
        .range(["black", "black"]);
    var map_button_ordinal = d3.legendColor()
        .orient("horizontal")
        .labelOffset("-18")
        .shape("line")
        .shapeWidth("120")
        .scale(map_button_scale_ordinal)
        .on("cellclick", d => update_map(d));
    chi_map_int_svg.select(".button_map")
        .attr("class", "d3axis")
        .call(map_button_ordinal);
    // set legend id
    chi_map_int_svg.selectAll(".legendCells")
        .selectAll(".cell")
        .attr("id", d => get_map_button_id(d))
    // set line characteristics
    chi_map_int_svg.selectAll(".legendCells")
        .selectAll("line")
        .style("stroke-width", "5")
    // set offset
    var map_legend_width = chi_map_int_svg.select(".legendCells").node().getBBox().width;
    chi_map_int_svg.selectAll(".legendCells")
        .attr("transform", "translate(" +  (map_width - map_legend_width + map_margin.right)/2 + "," + map_margin.top/2 + ")")
    // End map 2002/2017 selection

    // Begin detail breakout declarations
    var timeParse = d3.timeParse("%Y-%m");
    var geo_detail_svg = d3.select("#crime_geo_detail_svg"),
        margin = {top: 90, right: 20, bottom: 60, left: 90},
        detail_width = geo_detail_svg.attr("width") - margin.left - margin.right,
        detail_height = geo_detail_svg.attr("height") - margin.top - margin.bottom,
        intensity_g = geo_detail_svg
            .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleTime().range([0, detail_width]),
        y = d3.scaleLinear().range([detail_height, 0])
        detail_color = d3.scaleOrdinal()
            .domain([0, 1])
            .range([d3.schemeCategory10[0], "black"]);

    var line = d3.line()
        .x(d => x(d.time))
        .y(d => y(d.crime_intensity));

    // Begin intensity detail legend
    intensity_g
        .append("g")
        .attr("class", "legend_intensity_detail");
    var detail_scale_ordinal = d3.scaleOrdinal()
        .domain(["Hyde Park", "Chicago"])
        .range(detail_color.range());
    var detail_legend_ordinal = d3.legendColor()
        .orient("horizontal")
        .labelOffset("-18")
        .shape("line")
        .shapeWidth("120")
        .scale(detail_scale_ordinal)
        .on("cellclick", d => update_plot_type(d));
    intensity_g.select(".legend_intensity_detail")
        .attr("class", "d3axis")
        .call(detail_legend_ordinal);
    // set legend id
    intensity_g.selectAll(".legendCells")
        .selectAll(".cell")
        .attr("id", "crime_detail_legend_id")
    // set line characteristics
    intensity_g.selectAll(".legendCells")
        .selectAll("line")
        .style("stroke-width", "5")
    // set offset
    var legend_width = intensity_g.select(".legendCells").node().getBBox().width;
    intensity_g.selectAll(".legendCells")
        .attr("transform", "translate(" +  (detail_width - legend_width)/2 + "," + -margin.top/3 + ")")
    // End Legend
    // End detail breakout declarations

    ////////////
    // Begin reading in data for graphs/plots
    ////////////

    d3.json("static/data/chicago_geo.json", function(neighb_data) {

        var projection = d3.geoMercator()
            .fitExtent([[0, map_margin.top], [map_width, map_height + map_margin.top]], neighb_data);

        var path = d3.geoPath()
            .projection(projection);

        var color_scale_max = color_saturate_factor*d3.max(neighb_data.features.map(d => d.properties.crime_intensity_2002))

        map_color.domain([0, color_scale_max]);

        // draw the map of crime intensity
        chi_map_int_svg.append("g")
            .attr("class", "chicago_map")
            .selectAll("path")
            .data(neighb_data.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("stroke-width", "1")
            .attr("stroke", "black")
            .attr("fill", d => map_color(d.properties.crime_intensity_2017))
            .on("mouseover", function(d) { 
                d3.select(this)
                    .transition()
                    .attr("fill", d3.color("red").darker());
                update_city_detail(d.properties.community);
            }).on("mouseout", function(d) {
                d3.select(this)
                    .transition()
                    .attr("fill", d => map_color(d.properties.crime_intensity_2017));
            });

        update_map("2017"); // act as initializer

        // draw gradient legend for crime intensity -- do this here since it dep's on data
        // TODO: PUT THIS IN A FUNCTION
        var map_intensity_legend_width = 10,
            map_intensity_legend_height = 300;

        //Extra scale since the color scale is interpolated
        var countScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, map_intensity_legend_height])

        //Calculate the variables for the temp gradient
        var numStops = 10;
        countRange = countScale.domain();
        countRange[2] = countRange[1] - countRange[0];
        countPoint = [];
        for(var i = 0; i < numStops; i++) {
            countPoint.push(i * countRange[2]/(numStops-1) + countRange[0]);
        }//for i

        chi_map_int_svg.append("defs")
            .append("linearGradient")
            .attr("id", "gradient_fill_map_legend")
            //.attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "0%").attr("y2", "100%")
          .selectAll("stop")
            .data(d3.range(numStops))
            .enter()
            .append("stop")
            .attr("offset", function(d, i) { return countScale(countPoint[i])/map_intensity_legend_height; })
            .attr("stop-color", function(d, i) { return d3.scaleSequential(d3.interpolateBlues)(1 - countPoint[i]); });

        var map_intensity_legend = chi_map_int_svg.append("g")
            .attr("id", "map_intensity_legend")
            .attr("class", "d3axis")
            .attr("transform", "translate(" + (map_width - map_margin.right) + "," + map_height/2 + ")");

        map_intensity_legend.append("rect")
            .attr("x", 0)
            .attr("y", -map_intensity_legend_height/2 + map_margin.top)
            .attr("width", map_intensity_legend_width)
            .attr("height", map_intensity_legend_height)
            .style("stroke", "black")
            .style("fill", "url(#gradient_fill_map_legend)")
        
        map_intensity_legend.append("g")
            .attr("class", "d3axis")
            .call(d3.axisRight(d3.scaleLinear().domain([0, color_scale_max]).range([map_intensity_legend_height, 0])).ticks(4))
            .attr("transform", "translate(" + 
                (map_intensity_legend_width - 0.5) + "," + 
                (-map_intensity_legend_height/2 + map_margin.top - 0.5) + ")")
            .append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", map_intensity_legend_width + 40)
            .attr("x", (-map_intensity_legend_height/2))
            .attr("fill", "black")
            .text("Crime intensity");
        // end draw map of crime intensity

    });

    function update_map(year) {

        var legend_cells = chi_map_int_svg.selectAll(".legendCells").transition();
        var target_button = chi_map_int_svg.selectAll("#" + get_map_button_id(year)).transition();

        // update buttons -- reset
        legend_cells.selectAll("line")
            .style("opacity", "0.5");
        legend_cells.selectAll("text")
            .style("font-weight", null);

        // update buttons -- select one and highlight
        target_button.selectAll("line")
            .style("opacity", "1.0");
        target_button.selectAll("text")
            .style("font-weight", "bold");

        // update graph
        chi_map_int_svg.selectAll(".chicago_map").selectAll("path").transition()
            .attr("fill", d => map_color(d.properties["crime_intensity_" + year]))
    }

    // initialize the detail graph
    d3.csv('static/data/neighb_intensity/HYDE PARK_intensity.csv', function(csv_data) {

        var parsed_data = [[], []]
        csv_data.forEach(function(row) { 
            row.time = timeParse(row.time);
            row.neighb_crime_intensity = +row.neighb_crime_intensity;
            row.city_crime_intensity = +row.city_crime_intensity;
            parsed_data[0].push({"time" : row.time, "crime_intensity" : row.neighb_crime_intensity});
            parsed_data[1].push({"time" : row.time, "crime_intensity" : row.city_crime_intensity});
        });
        
        x.domain(d3.extent(csv_data.map(d => d.time)));
        y.domain([0, d3.max([d3.max(parsed_data[0], d => d.crime_intensity), d3.max(parsed_data[1], d => d.crime_intensity)])]);

        // begin plot axes
        intensity_g.append("g")
            .attr("class", "d3axis")
            .attr("transform", "translate(0," + detail_height + ")")
            .attr("id", "intensity_detail_x_axis")
            .call(d3.axisBottom(x).ticks(3))
            .append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + detail_width/2.0 + "," + 2*margin.bottom/3 + ")")
            .attr("fill", "black")
            .text("time");

        intensity_g.append("g")
            .attr("class", "d3axis")
            .attr("id", "intensity_detail_y_axis")
            .call(d3.axisLeft(y).ticks(3))
            .append("text")
            .attr("text-anchor", "middle")
            .attr("y", -margin.left/2)
            .attr("x", -detail_height/2)
            .attr("transform", "rotate(-90)")
            .attr("fill", "black")
            .text("Crime intensity");
        // end plot axes

        intensity_g.selectAll("svg")
            .data(parsed_data)
            .enter()
            .append("g")
            .attr("id", "intensity_detail_line")
            .append("path")
            .attr("d", d => line(d))
            .attr("fill", "none")
            .attr("stroke", function(d, i) { return detail_color(i); })
            .attr("stroke-width", "2");
        
    });


    function update_city_detail(neighb) {

        // Update data
        d3.csv('static/data/neighb_intensity/' + neighb + '_intensity.csv', function(csv_data) {
            
            var parsed_data = [[], []]
            csv_data.forEach(function(row) { 
                row.time = timeParse(row.time);
                row.neighb_crime_intensity = +row.neighb_crime_intensity;
                row.city_crime_intensity = +row.city_crime_intensity;
                parsed_data[0].push({"time" : row.time, "crime_intensity" : row.neighb_crime_intensity});
                parsed_data[1].push({"time" : row.time, "crime_intensity" : row.city_crime_intensity});
            });

            x.domain(d3.extent(csv_data.map(d => d.time)));
            y.domain([0, d3.max([d3.max(parsed_data[0], d => d.crime_intensity), d3.max(parsed_data[1], d => d.crime_intensity)])]);

            // Begin update axes
            intensity_g.select("#intensity_detail_x_axis")
                .transition()
                .call(d3.axisBottom(x).ticks(3))
           
            intensity_g.select("#intensity_detail_y_axis")
                .transition()
                .call(d3.axisLeft(y).ticks(3))
            // End update axes
            
            // begin plot each crime type over time
            var svg_temp = intensity_g
                .selectAll("#intensity_detail_line")
                .selectAll("path")
                .data(parsed_data)

            svg_temp
                .enter()
                .append("path")
                .merge(svg_temp)
                .transition()
                .attr("d", d => line(d))
                .attr("fill", "none")
                .attr("stroke", function(d, i) { return detail_color(i); })
                .attr("stroke-width", "2");

            svg_temp.exit().remove();
            // end plot each crime type over time

            // update the legend
            intensity_g.select(".legendCells")
                .select("text")
                .style("text-transform", "capitalize")
                .text(neighb.toLowerCase())
        });
    }

}

explore_city_container();


