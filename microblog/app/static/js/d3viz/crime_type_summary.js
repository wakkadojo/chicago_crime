var make_crime_intensity_time = function() {

    var crime_type_svg = d3.select("#crime_type_svg"),
        margin = {top: 20, right: 20, bottom: 60, left: 110},
        width = crime_type_svg.attr("width") - margin.left - margin.right,
        height = crime_type_svg.attr("height") - margin.top - margin.bottom,
        crime_type_g = crime_type_svg
            .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height/2, 0]),
        y_bot = d3.scaleLinear().range([height, height/2 + margin.top]),
        z = d3.scaleOrdinal(d3.schemeCategory10);        
        z_bot = d3.scaleOrdinal(d3.schemeCategory10);        
        
    var area = d3.area()
        .x(d => x(d.data.time))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))

    var area_bot = d3.area()
        .x(d => x(d.data.time))
        .y0(d => y_bot(d[0]))
        .y1(d => y_bot(d[1]))

    var timeParse = d3.timeParse("%Y-%m");

    var get_crime_type_line_id   = function(type) { return type + "_type_line"; }
        get_crime_type_area_id   = function(type) { return type + "_type_area"; }
        get_crime_type_legend_id = function(type) { return type + "_type_legend"; }
        get_crime_detail_area_id = function(type) { return type + "_type_detail_area"; }
        get_crime_detail_legend_id = function(type) { return type + "_type_detail_legend"; }
        get_crime_detail_area_explanation_id = function() { return "type_detail_area_explanation"; }

    var crime_type_mouseover = function(type) {
        d3.select("#" + get_crime_type_area_id(type)).style("opacity", "0.8");
        d3.select("#" + get_crime_type_legend_id(type)).style("font-weight", "bold");
        d3.selectAll("#" + get_crime_detail_area_id(type)).style("opacity", "0.5");
        d3.selectAll("#" + get_crime_detail_legend_id(type)).style("opacity", "1");
        d3.selectAll("#" + get_crime_detail_area_explanation_id()).style("opacity", "0");
    }

    var crime_type_mouseout = function(type) {
        d3.select("#" + get_crime_type_area_id(type)).style("opacity", "0.5");
        d3.select("#" + get_crime_type_legend_id(type)).style("font-weight", null);
        d3.selectAll("#" + get_crime_detail_area_id(type)).style("opacity", "0");
        d3.selectAll("#" + get_crime_detail_legend_id(type)).style("opacity", "0");
        d3.selectAll("#" + get_crime_detail_area_explanation_id()).style("opacity", "1");
    }

    d3.csv("static/data/chicago_crimes_percapita_crimetype.csv", function(csv_data) {

        csv_data.forEach(function(row) { 
            Object.keys(row).forEach(function(key) {
                if(key == 'time') {
                    row[key] = timeParse(row[key]);
                } else {
                    row[key] = row[key] == "" ? null : +row[key];
                } 
            });
        })

        var stack_keys = Object.keys(csv_data[0]).filter(d => d != 'time');
        
        var type_stack_gen = d3.stack()
            .keys(stack_keys)
            .order(d3.stackOrderReverse); // Reverse to match rendering orientation

        var type_stack = type_stack_gen(csv_data);
        
        x.domain(d3.extent(type_stack[0].filter(d => d.data.time.getFullYear() > 2001).map(d => d.data.time)));
        y.domain([0, d3.max(type_stack[0].map(d => d[1]))]);
        z.domain(stack_keys);

        // Begin make axes
        crime_type_g.append("g")
            .attr("class", "d3axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x)
                .tickFormat(d3.timeFormat("%Y-%m"))
            )
            .call(d3.axisBottom(x))
            .append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + (width/2.0) + "," + 2*margin.bottom/3 + ")")
            .attr("fill", "black")
            .text("time");
       
        crime_type_g.append("g")
            .attr("class", "d3axis")
            .call(d3.axisLeft(y).ticks(4))
            .append("text")
            .attr("text-anchor", "middle")
            .attr("y", -margin.left/2)
            .attr("x", -height/4)
            .attr("transform", "rotate(-90)")
            .attr("fill", "black")
            .text("crime intensity");
        // End make axes

        var start_idx = 0

        // begin plot each crime type over time
        crime_type_g.selectAll("svg")
            .data(type_stack)
            .enter()
            .append("path")
            .attr("d", d => area(d))
            .attr("id", d => get_crime_type_area_id(d.key))
            .style("fill", d => z(d.key))
            .style("opacity", "0.5")
            .on("mouseover", function(d) { crime_type_mouseover(d.key); })
            .on("mouseout", function(d) { crime_type_mouseout(d.key); });

        // labels
        crime_type_g.selectAll("svg")
            .data(type_stack)
            .enter()
            .append("text")
            .attr("id", d => get_crime_type_legend_id(d.key))
            .attr("x", 6)
            .attr("y", d => y((d[start_idx][0] + d[start_idx][1])/2))
            .attr("class", "d3axis")
            .style("alignment-baseline",  "middle")
            .text(d => d.key)
            .on("mouseover", function(d) { crime_type_mouseover(d.key); })
            .on("mouseout", function(d) { crime_type_mouseout(d.key); });
        // end plot each crime type over time
    });

    d3.csv("static/data/chicago_crimes_percapita_crimelevel.csv", function(csv_data) {

        csv_data.forEach(function(d) { 
            d.crime_intensity = d.crime_intensity == "" ? null : +d.crime_intensity;
        });

        var crime_nest = d3.nest()
            .key(d => d.crime_type)
            .key(d => d.time)
            .entries(csv_data);

        var crime_desc = []
        crime_nest.forEach(function(type) {
            crime_desc[type.key] = []
            type.values.forEach(function(time) {
                // parse string to time here -- otherwise when we group we have a big string (not date)
                var next_row = {"time" : timeParse(time.key)}
                time.values.forEach(function(d) { 
                    next_row[d.crime_description] = d.crime_intensity;
                })
                crime_desc[type.key].push(next_row);
            });
        });

        
        var type_stack_gen = d3.stack()
            .order(d3.stackOrderReverse); // Reverse to match rendering orientation

        var df = crime_desc['Property'];

        var stack_keys = {}
        var type_stacks = {}
        Object.keys(crime_desc).forEach(function(key) {
            stack_keys[key] = Object.keys(crime_desc[key][0]).filter(d => d != 'time');
            type_stacks[key] = type_stack_gen.keys(stack_keys[key])(crime_desc[key]);
        })

        var max_of_stacks = 0.0;
        for(let key in type_stacks) {
            let local_max = d3.max(type_stacks[key][0].map(d => d[1]));
            max_of_stacks = max_of_stacks > local_max ? max_of_stacks : local_max;    
        }
        var max_len_of_stacks = 0;
        for(let key in stack_keys) {
            let local_len = stack_keys[key].length;
            max_len_of_stacks = max_len_of_stacks > local_len ? max_len_of_stacks : local_len;
        }

        // x domain handled above
        y_bot.domain([0, max_of_stacks]);
        z_bot.domain([0, max_len_of_stacks]);

        // Begin make axes
        // x axis made already above
       
        crime_type_g.append("g")
            .attr("class", "d3axis")
            .call(d3.axisLeft(y_bot).ticks(4))
            .append("text")
            .attr("text-anchor", "middle")
            .attr("y", -margin.left/2)
            .attr("x", -height/4 - height/2 - margin.top)
            .attr("transform", "rotate(-90)")
            .attr("fill", "black")
            .text("crime intensity");
        // End make axes

        // Mini explanation
        crime_type_g.append("g")
            .append("text")
            .attr("x", width/2)
            .attr("id", get_crime_detail_area_explanation_id())
            .attr("y", 3*height/4 + margin.top)
            .attr("class", "d3axis")
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .style("fill", "Gray")
            .text("Hover over above crime type for detail");

        var start_idx = 0

        // stacked plot
        for(let key in type_stacks) {
            crime_type_g.selectAll("svg")
                .data(type_stacks[key])
                .enter()
                .append("path")
                .attr("id", get_crime_detail_area_id(key))
                .attr("d", d => area_bot(d))
                .style("fill", (d, i) => z_bot(i))
                .style("opacity", "0.0")

            // labels
            crime_type_g.selectAll("svg")
                .data(type_stacks[key].filter(d => d[start_idx][1] - d[start_idx][0] > 0.002))
                .enter()
                .append("text")
                .attr("id", get_crime_detail_legend_id(key))
                .attr("x", 6)
                .attr("y", d => y_bot((d[start_idx][0] + d[start_idx][1])/2))
                .attr("class", "d3axis")
                .style("alignment-baseline",  "middle")
                .style("opacity", "0.0")
                .text(d => d.key);
        }
        // end plot each crime type over time

    });

}

make_crime_intensity_time();
