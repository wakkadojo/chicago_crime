function make_crime_weighting_diff() {

    var svg = d3.select("#crime_pct_severity_compare_svg"),
        margin = {top: 20, right: 20, bottom: 20, left: 20},
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom,
        canvas = svg.append("g")
            .attr("transform", "translate(" + margin.left + ", " + margin.right + ")"),
        bubble_x_buffer = 20,
        bubble_y_buffer = 1,
        bubble_y_offset = 150,
        bubble_y_text_offset = 75;

    var color = d3.scaleOrdinal(d3.schemeCategory10)

    var selected_type_global = null;

    var r = function(pct) { return Math.max(2, width * Math.sqrt(pct) / 10); },
        y_ctr = function(type) { return (color.domain().findIndex(c => c == type) + 0.5) * bubble_y_offset; },
        y_ctr_selected = function(type, selected_type) { 
            var type_idx = color.domain().findIndex(c => c == type),
                selected_idx = color.domain().findIndex(c => c == selected_type);

            return (color.domain().findIndex(c => c == type) + 0.5) * bubble_y_offset + (type_idx < selected_idx ? 0 : bubble_y_text_offset); 
        }

    function get_bubble_cluster_id(type) { return "bubble_cluster_" + type + "_id"; }

    function get_tooltip_id(crime) { return crime.replace(/\W/g, '') + "_weight_tooltip_id"; }

    // Draw
    d3.csv("static/data/recent_crime_ct_severity_stats.csv", function(csv_data) {

        color.domain(csv_data.map(d => d.crime_type));

        var nodes_generic = csv_data.map(function(d) {
            return {
                cluster         : d.crime_type,
                description     : d.crime_description,
                severity_pct    : +d.severity_pct,
                crime_count_pct : +d.crime_count_pct,
                mean_severity   : +d.mean_severity,
                r_severity      : r(+d.severity_pct),
                r_count         : r(+d.crime_count_pct)
            }
        }).sort(function(x, y) {
            return d3.descending(x.crime_count_pct, y.crime_count_pct);
        })


        var increment_x = (node1, node2) => Math.max(node1.r_severity + node2.r_severity, node1.r_count + node2.r_count) + bubble_x_buffer,
            last_node = color.domain().reduce(function(map, obj) {
                map[obj] = {x : 0, r_severity : 0, r_count : 0};
                return map;
            }, {});
            
        for(var i=0; i<nodes_generic.length; i++) {
            var ref = last_node[nodes_generic[i].cluster]

            nodes_generic[i].x = ref.x + increment_x(nodes_generic[i], ref);
            last_node[nodes_generic[i].cluster] = nodes_generic[i];
        }

        var pct_nodes = nodes_generic.map(function(old_d) {
                var d = Object.assign({}, old_d);
                d.y = - d.r_count - bubble_y_buffer;
                d.r = d.r_count;
                d.wgt_type = "count";
                return d;
            }),
            sev_nodes = nodes_generic.map(function(old_d) {
                var d = Object.assign({}, old_d);
                d.y = d.r_severity + bubble_y_buffer;
                d.r = d.r_severity;
                d.wgt_type = "severity";
                return d;
            }),
            nodes = pct_nodes.concat(sev_nodes),
            nest_nodes = d3.nest()
                .key(d => d.cluster)
                .entries(nodes);

        var initial_selection = color.domain()[0],
            selected_type_global = initial_selection;

        function select_type_event(selected_type, crime_data) {
            
            canvas.selectAll(".crime_share_bubble_cluster")
                .transition()
                .attr("transform", d => "translate(0," + y_ctr_selected(d.key, selected_type) + ")");

            // update individual crime labels
            var crime_labels = canvas.selectAll(".crime_bubble_label_container")
                .selectAll("text")
                .data(d => d.values.filter(x => x.wgt_type == "count" && x.cluster == selected_type));

            crime_labels.enter().append("text")
              .merge(crime_labels)
                .transition()
                .attr("class", "d3tooltiptext crime_label")
                .attr("alignment-baseline", "middle")
                .attr("transform", d => "translate(" + (d.x + d.r/1.4 + 4) + "," + (d.y - d.r/1.4 - 4) + ") rotate(-45)")
                .attr("pointer-events", "none")
                .text(d => d.description);

            crime_labels.exit().remove();

            // update description text
            var label_text = [
                {x: end_x, y: -6, v_align: "baseline", label: "weighted by count"},
                {x: end_x, y: 6, v_align: "hanging", label: "weighted by crime sentencing"}
            ]

            var wgt_type_label = canvas.selectAll(".crime_share_wgt_type_container")
                .selectAll("text")
                .data(d => d.key == selected_type ? label_text : []);

            wgt_type_label.enter().append("text")
              .merge(wgt_type_label)
                .transition()
                .attr("class", "d3axis")
                .attr("alignment-baseline", d => d.v_align)
                .attr("text-anchor", "end")
                .attr("transform", d => "translate(" + d.x + "," + d.y + ")")
                .text(d => d.label)

            wgt_type_label.exit().remove();

            // update autotext
            d3.select("#crime_pct_severity_compare_autotext_div")
                .html(make_autotext(selected_type, crime_data));

        }

        // bounding area
        var start_x = d3.min(nodes.map(d => d.x - d.r)),
            end_x = width;
        
        // initialize sections
        var types = canvas.selectAll(".crime_share_bubble_cluster")
            .data(nest_nodes)
          .enter().append("g")
            .attr("class", "crime_share_bubble_cluster")
            .attr("transform", d => "translate(0," + y_ctr_selected(d.key, initial_selection) + ")")
            .attr("id", d => get_bubble_cluster_id(d.key));
        // add labels
        types.append("g")
            .append("text")
            .attr("class", "d3axis")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text(d => d.key);
        // create containers for crime weight type labels
        types.append("g")
            .attr("class", "crime_share_wgt_type_container");
        // create containers for individual crime labels
        types.append("g")
            .attr("class", "crime_bubble_label_container");
        // add center line
        types.append("line")
            .attr("stroke", "black")
            .attr("stroke-width", "1")
            .attr("x1", start_x).attr("x2", width)
            .attr("y1", "0").attr("y2", "0");

        // add rects on top for hover  
        // -- note that we use a global variable to track if the item is already selected and a transition is underway
        // -- that is because there is choppiness if we constantly enter / exit the selection to recalculate
        //    the transition that's already in progress
        types.append("rect")
            .attr("id", "mouse_hover_type_selection")
            .attr("width", width)
            .attr("height", bubble_y_offset)
            .attr("y", -bubble_y_offset/2)
            .attr("opacity", "0")
            .on("mouseover", function (d) { 
                if(d.key != selected_type_global)
                    select_type_event(d.key, d.values); 
                selected_type_global = d.key;
            });
        
        // draw bubbles
        var crime_bubbles = types.append("g")
            .selectAll("circle")
            .data(d => d.values)
          .enter().append("circle")
            .style("fill", d => color(d.cluster))
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => d.r)
            .on("mouseover", function(d) {
                var x = d.x + d.r/1.4 + 7,
                    y = d.y + d.r/1.4 + 7;

                var tt_text = '<tspan style="font-weight: bolder;" alignment-baseline="middle">' + d.mean_severity.toFixed(2) + "</tspan> year average sentencing";

                var tt = add_tooltip(d3.select(this.parentNode), x, y, tt_text, id = get_tooltip_id(d.description))
            })
            .on("mouseout", function(d) {
                d3.select(this.parentNode)
                    .selectAll("#" + get_tooltip_id(d.description))
                    .transition()
                    .style("opacity", "0")
                    .remove()
            })

        // initialize
        select_type_event(nest_nodes[0].key, nest_nodes[0].values);

    });

    // autotext
    function make_autotext(selected_type, crime_data) {

        var data = crime_data.filter(d => d.wgt_type == "severity")

        var crime_type_description = "<b>" + (selected_type == "Society" ? "crimes against Society" : selected_type + " crimes") + "</b>",
            total_pct_ct_num = d3.sum(data.map(d => d.crime_count_pct)),
            total_pct_sev_num = d3.sum(data.map(d => d.severity_pct)),
            total_pct_ct = "<b>" + (Math.round(100*total_pct_ct_num)) + "%</b>",
            total_pct_sev = "<b>" + (Math.round(100*total_pct_sev_num)) + "%</b>",
            over_under = Math.abs(total_pct_sev_num - total_pct_ct_num) < 0.05 ? "is <b>similar</b> to" : (total_pct_sev_num > total_pct_ct_num ? "<b>underestimates</b>" : "<b>overestimates</b>")

        // biggest diffs in category
        var big_diffs = data.map(function(d) {
                return {
                    biggest       : Math.max(d.crime_count_pct, d.severity_pct),
                    relative_diff : Math.abs(2*(d.severity_pct - d.crime_count_pct) / (d.severity_pct + d.crime_count_pct)),
                    is_over       : d.crime_count_pct > d.severity_pct,
                    description   : d.description
                }
            })
            .filter(d => d.biggest > 0.01 && d.relative_diff > 0.5)
            .sort(function(x, y) { return d3.descending(x.relative_diff, y.relative_diff) })

        function make_over_crimes_text(arr, over) {
                if(arr.length == 0) {
                    return "does not " + (over ? "overestimate": "underestimate the prevelance of") + " any particular crime";
                } else if(arr.length == 1) {
                    return (over ? "overestimates" : "underestimates the prevelance of") + " <b>" + arr[0] + "</b>";
                } else {
                    return (over ? "overestimates" : "underestimates the prevelance of") + " <b>" + arr.filter(function(d, i) { return i < arr.length-1; }).join("</b>, <b>") + "</b> and <b>" + arr[arr.length-1] + "</b>";
                }
            }
            
        var over_crimes_arr = big_diffs.filter(d => d.is_over).map(d => d.description),
            under_crimes_arr = big_diffs.filter(d => !d.is_over).map(d => d.description),
            over_crimes = make_over_crimes_text(over_crimes_arr, true),
            under_crimes = make_over_crimes_text(under_crimes_arr, false)


        var autotext = "When measuring total crime by count, " + crime_type_description + " represent " + total_pct_ct + " of total crime, which " + 
            over_under + " the " + total_pct_sev + " fraction when accounting for crime severity. " +
            "Within this category, considering crime volume solely by count " + under_crimes + ", and " + over_crimes + "."

        return autotext;

    }

}

make_crime_weighting_diff();
