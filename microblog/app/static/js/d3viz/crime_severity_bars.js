function make_crime_severity_bars () {

    // canvas parameters
    var svg = d3.select("#crime_severity_bar_svg"),
        margin = {left: 30, right:20, top: 20, bottom: 20},
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom,
        canvas = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // bar chart parameters
    var max_sev = 6,
        bar_width = width*0.55,
        bar_height = 12,
        bar_buffer = 6,
        type_buffer = 30,
        bar_scale = d3.scaleLinear().domain([0, max_sev]).range([0, bar_width]),
        color = d3.scaleOrdinal(d3.schemeCategory10);

    function get_bar_group_id(key) { return key + "_bar_group_id"; }

    function get_bar_individual_id(crime) { return crime.replace(/\W/g, "") + "_individual_sev_bar_id"; }
    
    function get_hover_line_id(crime) { return crime.replace(/\W/g, "") + "_hover_line_id"; }

    function y_base(type, sev_nest) {
        var idx = sev_nest.findIndex(d => d.key == type),
            offset = d3.sum(sev_nest.filter((d, i) => i < idx), d => d.values.length) * (bar_height + bar_buffer) + idx * type_buffer;

        return offset;
    }

    function nest_and_sort_severity_data(csv_data) {

        var sev_nest = d3.nest()
            .key(d => d.crime_type)
            .rollup(function(v) { return {
                values: v,
                mean_severity: 
                    d3.sum(v, d => d.total_severity)/d3.sum(v, d => d.crime_count)
            }; })
            .entries(csv_data);

        // clean up the nest to get rid of the "value" intermediary 
        sev_nest.forEach(function(v) {
            v.values = v.value.values.sort((a, b) => d3.descending(a.mean_severity, b.mean_severity));
            v.mean_severity = v.value.mean_severity;
            delete v.value;
        });

        return sev_nest;
    }

    function get_axis_y(sev_nest) {
        return y_base(sev_nest[sev_nest.length-1].key, sev_nest) + 
               sev_nest[sev_nest.length-1].values.length * (bar_height + bar_buffer) + 
               bar_buffer
    }

    d3.csv("static/data/recent_crime_ct_severity_stats.csv", function(row) { // preprocess
        // convert strings to numbers where applicable
        Object.keys(row).forEach(function(k) {
            if(!isNaN(row[k]))
                row[k] = +row[k];
        });
        return row;                 
    }, function(csv_data) { // plot

        sev_nest = nest_and_sort_severity_data(csv_data);
        color.domain(sev_nest.map(d => d.key));

        var types = canvas.selectAll(".crime_sev_bar_container")
            .data(sev_nest)
          .enter().append("g")
            .attr("class", "crime_sev_bar_container")
            .attr("transform", d => "translate(0," + y_base(d.key, sev_nest) + ")")
            .attr("id", d => get_bar_group_id(d.key));

        // bars -- note cut off at max
        // TODO: Migrate hover functions to no longer be inlined...
        var bars = types.append("g")
            .selectAll(".crime_sev_bar")
            .data(d => d.values)
          .enter().append("g")
            .attr("class", d => "crime_sev_bar " + get_bar_individual_id(d.crime_description))
            .on("mouseover", function(d) {
                // dim other elements
                canvas.selectAll(".crime_sev_bar")
                    .filter(v => v.crime_description != d.crime_description)
                    .selectAll(function() { return this.childNodes; }) // select child nodes for transition to work
                    .transition()
                    .style("opacity", "0.4");
                // add vertical line
                canvas.selectAll("#" + get_hover_line_id(d.crime_description))
                    .data([d].filter(v => v.mean_severity < max_sev)) // do not act on data exceeding max severity
                  .enter()
                    .append("line")
                    .attr("opacity", "0")
                    .transition()
                    .attr("id", get_hover_line_id(d.crime_description))
                    .attr("x1", v => bar_scale(v.mean_severity))
                    .attr("y1", 0)
                    .attr("x2", v => bar_scale(v.mean_severity))
                    .attr("y2", get_axis_y(sev_nest))
                    .attr("stroke", "black")
                    .attr("opacity", null)
                    .style("stroke-dasharray", ("3, 3"));
            })
            .on("mouseout", function(d) {
                canvas.selectAll(".crime_sev_bar")
                    .selectAll(function() { return this.childNodes; })
                    .transition()
                    .style("opacity", null);

                
                canvas.selectAll("#" + get_hover_line_id(d.crime_description))
                    .transition()
                    .style("opacity", "0")
                    .remove();
            })
          
        bars.append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * (bar_height + bar_buffer))
            .attr("width", (d, i) => bar_scale(Math.min(max_sev, d.mean_severity)))
            .attr("height", bar_height)
            .attr("fill", d => color(d.crime_type));
          
        bars.append("text")
            .attr("x", bar_width * 1.3)
            .attr("y", (d, i) => i * (bar_height + bar_buffer) + 0.5*bar_height)
            .attr("class", "d3axis")
            .attr("alignment-baseline", "middle")
            .text(d => d.crime_description);


        // BEGIN EXTENDING CUT-OFF BARS
        // annotate bars exceeding scale as given
        var extensions = bars.filter(d => d.mean_severity > max_sev);

        // extension triangle for embellishment
        extensions.append("path")
            .attr("d", (d, i) => "M " + bar_scale(max_sev) + " " + (i*(bar_height + bar_buffer)) + " " +
                                 "L " + (bar_scale(max_sev) + bar_height) + " " + (i*(bar_height + bar_buffer)) + " " +
                                 "L " + bar_scale(max_sev) + " " + (i*(bar_height + bar_buffer) + bar_height))
            .attr("fill", d => color(d.crime_type));
        // cut line for embellishment
        extensions.append("path")
            .attr("d", (d, i) => "M " + (bar_scale(max_sev) + bar_height*1.1) + " " + (i*(bar_height + bar_buffer) - bar_height*0.1) + " " +
                                 "L " + (bar_scale(max_sev) - bar_height*0.1) + " " + (i*(bar_height + bar_buffer) + bar_height*1.1))
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", "2");
        // line for arrow
        extensions.append("path")
            .attr("d", (d, i) => "M " + (bar_scale(max_sev) + bar_height/2) + " " + (i*(bar_height + bar_buffer) + bar_height/2) + " " +
                                 "L " + (bar_scale(max_sev) + 5*bar_height/2) + " " + (i*(bar_height + bar_buffer) + bar_height/2))
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", "2");
        // arrowhead
        extensions.append("path")
            .attr("d", (d, i) => 
                "M " + (bar_scale(max_sev) + 5*bar_height/2) + " " + (i*(bar_height + bar_buffer) + bar_height/2 - bar_height/4) + " " +
                "L " + (bar_scale(max_sev) + 5*bar_height/2 + bar_height*0.75) + " " + (i*(bar_height + bar_buffer) + bar_height/2) + " " +
                "L " + (bar_scale(max_sev) + 5*bar_height/2) + " " + (i*(bar_height + bar_buffer) + bar_height/2 + bar_height/4) + " Z")
            .attr("fill", "black")
            .attr("stroke", "black")
            .attr("stroke-width", "3")
            .attr("stroke-linejoin", "round");
        // text with crime number
        extensions.append("text")
            .attr("class", "d3axis")
            .attr("x", (bar_scale(max_sev) + 5*bar_height/2 + 1.5*bar_height))
            .attr("y", (d, i) => (i*(bar_height + bar_buffer) + 0.5*bar_height))
            .html(d => '<tspan style="alignment-baseline: middle; font-weight: bolder;">' + (Math.round(10*d.mean_severity)/10) + "</tspan>");
        // END EXTENDING CUT-OFF BARS
       
        // lines and labels for crime types
        types.append("line")
            .attr("x1", 0)
            .attr("y1", -bar_buffer/2)
            .attr("x2", 0)
            .attr("y2", d => (d.values.length - 1) * (bar_height + bar_buffer) + bar_height + bar_buffer/2)
            .attr("stroke", "black")
            .attr("stroke-width", "1");

        types.append("text")
            .attr("transform", d => "translate(" + (-margin.left/2) + "," + (0.5*((d.values.length - 1) * (bar_height + bar_buffer) + bar_height)) + ") rotate(-90)")
            .attr("class", "d3axis")
            .attr("text-anchor", "middle")
            .text(d => d.key);

        // axis below
        canvas.append("g")
            .attr("class", "d3axis")
            .attr("transform", d => "translate(0," + get_axis_y(sev_nest) + ")")
            .call(d3.axisBottom(bar_scale).tickValues(d3.range(bar_scale.domain()[0], bar_scale.domain()[bar_scale.domain().length-1]+1, 1)))
            .append("text")
            .attr("transform", "translate(" + (bar_scale(max_sev)/2) + ", 0)")
            .attr("dy", "2.5em")
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .text("Average sentencing (years)");

    });
}

make_crime_severity_bars();
