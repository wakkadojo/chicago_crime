function make_inequality_toy_example() {

    var svg = d3.select("#gini_example_svg"),
        margin = {top: 20, right: 20, bottom: 20, left: 20},
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom;

    var neighbs = [ "Fake View", "Hide Park", "Loupe", "Logan Circle" ],
        crime_levels = [ 0.8, 0.3, 0.4, 0.15 ],
        data = neighbs.map(function(d, i) { 
            return {neighb: neighbs[i],
                    level:  crime_levels[i]}; 
            });

    var bar_width = 100,
        bar_buffer = 20,
        click_rect_height = 10,
        min_crime = 0.1,
        max_bar_height = 125,
        bar_base = max_bar_height + 50,
        bar_class_name = function(neighb) { return neighb.replace(/\s/g, '') + "_bar_class"; };

    var axis_width = neighbs.length * (bar_width + bar_buffer) - bar_buffer,
        axis_height = max_bar_height*1.5,
        x = d3.scaleLinear().domain([0, 1]).range([0, axis_width]),
        y = d3.scaleLinear().domain([0, 1]).range([0, -axis_height]),
        line = d3.line()
            .x(d => x(d.x))
            .y(d => y(d.y));

    var color = d3.scaleOrdinal(d3.schemeCategory10).domain(neighbs);

    // canvases for drawing

    var canvas = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")"),
        bar_canvas = canvas.append("g").attr("transform", "translate(" + ((width - axis_width)/2) + ",0)"),
        lorenz_canvas = canvas.append("g").attr("transform", "translate(" + ((width - axis_width)/2) + "," + (120 + bar_base + axis_height) + ")");

    var drag = d3.drag()
        .on("drag", function(d) {
            var neighb_class = bar_class_name(d.neighb),
                mouse_y = d3.event.y,
                base_distance = bar_base - mouse_y,
                level = Math.max(Math.min(1.0, base_distance / max_bar_height), min_crime);

            bar_canvas.selectAll("." + neighb_class + ".drag_rect")
                .attr("y", -max_bar_height * level + bar_base - click_rect_height/2)
                .attr("height", click_rect_height);
            
            bar_canvas.selectAll("." + neighb_class + ".magnitude_rect")
                .attr("y", -max_bar_height * level + bar_base)
                .attr("height", max_bar_height * level);
        })
        .on("end", function(d) {
            var neighb_class = bar_class_name(d.neighb),
                mouse_y = d3.event.y,
                base_distance = bar_base - mouse_y,
                level = Math.max(Math.min(1.0, base_distance / max_bar_height), min_crime);

            // update data
            data.forEach(u => u.level = u.neighb == d.neighb ? level : u.level)

            // update lorenz
            update_lorenz(data);

            // update text
            update_bars(data);

        })


    function update_lorenz(data_in) {

        var total_crime = d3.sum(data_in.map(d => d.level)),
            data_prep = data_in
                .map(function(d) { return { neighb: d.neighb, level: d.level / total_crime }; })
                .sort((a, b) => d3.ascending(a.level, b.level)),
            data = [],
            gini = 0;

        for(var i=0; i<data_prep.length; i++) {
            var last = i > 0 ? data[i-1].points[1].y : 0;
            data[i] = { neighb: data_prep[i].neighb,
                        points: [
                            {x: i/data_prep.length,     y: last},
                            {x: (i+1)/data_prep.length, y: last + data_prep[i].level} 
                        ],
                        x_center : (i+0.5)/data_prep.length,
                        y_center : last + data_prep[i].level/2,
                        render_slope : -y(data_prep[i].level)/x(1/data_prep.length)
                      }
            gini += (last + data_prep[i].level/2)/data_prep.length;
        }
        
        gini = 1 - 2*gini;

        // update the title
        lorenz_canvas.select("#lorenz_title")
            .html('<tspan font-weight="bolder" text-decoration="underline">Gini coefficient:</tspan> ' + 
                  '1 &#8722; 2&#10005;(Shaded area under curve) = ' +
                  '<tspan font-weight="bolder">' + gini.toFixed(2) + '</tspan>'
            )

        // Shade the area under the curve
        var shaded_area = lorenz_canvas
            .selectAll(".lorenz_area")
            .data([data.map(d => d.points[0]).concat([{x: 1, y: 1}, {x: 1, y: 0}])]);

        shaded_area.enter()
            .append("path")
            .merge(shaded_area)
          .transition()
            .attr("class", "lorenz_area")
            .attr("d", d => line(d))
            .attr("fill", "lightgrey");

        shaded_area.exit().remove();

        // individual lines
        var lorenz_segments = lorenz_canvas
            .selectAll(".neighb_line")
            .data(data, d => d.neighb)

        lorenz_segments.enter()
            .append("path")
            .merge(lorenz_segments)
          .transition()
            .attr("class", "neighb_line")
            .attr("d", d => line(d.points))
            .attr("stroke", d => color(d.neighb))
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 5);

        lorenz_segments.exit().remove();

        // text denoting line
        var lorenz_labels = lorenz_canvas
            .selectAll(".neighb_label")
            .data(data, d => d.neighb);

        lorenz_labels.enter()
            .append("text")
            .merge(lorenz_labels)
          .transition()
            .attr("class", "neighb_label")
            .attr("transform", d => "translate(" + 
                (x(d.x_center) - 7/Math.sqrt(1 + 1/d.render_slope))   + "," + 
                (y(d.y_center) - 7/Math.sqrt(1 + d.render_slope)) + ") " + 
                "rotate(-" + (180*Math.atan2(d.render_slope, 1)/Math.PI) + ")")
            .attr("class", "d3axis neighb_label")
            .attr("text-anchor", "middle")
            .text(d => d.neighb);

        lorenz_labels.exit().remove();
    }

    function update_bars(data) {

        var smallest_level = d3.min(data.map(d => d.level)),
            largest_level = d3.max(data.map(d => d.level)),
            argmin = data.findIndex(d => d.level == smallest_level),
            argmax = data.findIndex(d => d.level == largest_level);

        // Crime ratio text
        bar_canvas.select("#bar_title")
            .html('<tspan font-weight="bolder" text-decoration="underline">Crime ratio:</tspan> ' + 
                  'Crime in worst 25% (<tspan font-weight="bolder">' + data[argmax].neighb + '</tspan>) / ' +
                  'best 25% (<tspan font-weight="bolder">' + data[argmin].neighb + '</tspan>) = ' +
                  '<tspan font-weight="bolder">' + (data[argmax].level/data[argmin].level).toFixed(1) + '</tspan>'
            )

    }

    // Touch to create title text templates
    bar_canvas.append("text")
        .attr("id", "bar_title")
        .attr("transform", "translate("+((neighbs.length*(bar_width+bar_buffer) - bar_buffer)/2)+",20)")
        .attr("class", "d3axis")
        .attr("text-anchor", "middle")

    lorenz_canvas.append("text")
        .attr("id", "lorenz_title")
        .attr("transform", "translate("+(axis_width/2)+"," + (-axis_height - 30) + ")")
        .attr("class", "d3axis")
        .attr("text-anchor", "middle")
    
    // bar instruction
    bar_canvas.append("text")
        .attr("id", "bar_instruction")
        .attr("transform", "translate("+((neighbs.length*(bar_width+bar_buffer) - bar_buffer)/2)+"," + 
              (axis_height/3)+ ")")
        .attr("fill", "lightgrey")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .text("Drag tops of bars to vary neighborhood crime intensity")
        
    // bar labels
    bar_canvas.append("g")
        .selectAll("text")
        .data(data)
      .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", (d, i) => "translate(" + (bar_width/2 + i*(bar_buffer + bar_width)) + "," + (bar_base + 20) + ")")
        .attr("class", "d3axis")
        .text(d => d.neighb)

    // initialize crime drag bars
    var bars = bar_canvas.selectAll("rect")
        .data(data)
      .enter()
      
    bars.append("rect")
        .attr("x", (d, i) => i*(bar_width + bar_buffer))
        .attr("y", d => -max_bar_height * d.level + bar_base)
        .attr("width", bar_width)
        .attr("height", d => max_bar_height * d.level)
        .attr("fill", d => color(d.neighb))
        .attr("class", d => bar_class_name(d.neighb) + " magnitude_rect");

    bars.append("rect")
        .attr("x", (d, i) => i*(bar_width + bar_buffer))
        .attr("y", d => -max_bar_height * d.level + bar_base - click_rect_height/2)
        .attr("width", bar_width)
        .attr("height", click_rect_height)
        .attr("fill", d => d3.color(color(d.neighb)).darker(1.5))
        .attr("cursor", "ns-resize")
        .attr("class", d => bar_class_name(d.neighb) + " drag_rect")
        .call(drag);

    // labes and embellishment for crime level toggle
    bar_canvas.append("text")
        .attr("class", "d3axis")
        .attr("transform", "translate(-45," + (bar_base - max_bar_height/2) + ") rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text("Crime intensity")
    /*
    bar_canvas.append("text")
        .attr("class", "d3axis")
        .attr("transform", "translate(" + (axis_width/2) + "," + (bar_base + 40) + ")")
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text("(Drag tops of bars to change height)")*/

    bar_canvas.append("line")
        .attr("x1", -bar_buffer/2).attr("x2", neighbs.length*(bar_width + bar_buffer) - bar_buffer/2)
        .attr("y1", bar_base).attr("y2", bar_base)
        .attr("stroke-width", 1)
        .attr("stroke", "black")

    // initialize lorenz axes
    lorenz_canvas.append("g")
        .attr("class", "d3axis")
      .call(d3.axisBottom(x).ticks(4))
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(" + (axis_width/2) + "," + 40 + ")")
        .attr("fill", "black")
        .html('<tspan x="0">Cumulative share of population</tspan><tspan x="0" dy="1.25em">(Ordered lowest crime to highest crime)</tspan>')

    lorenz_canvas.append("g")
        .attr("class", "d3axis")
      .call(d3.axisLeft(y).ticks(4))
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(-45," + (-axis_height/2) + ") rotate(-90)")
        .attr("fill", "black")
        .text("Cumulative share of crime")

    // initialize
    update_lorenz(data);
    update_bars(data);

}

make_inequality_toy_example();
