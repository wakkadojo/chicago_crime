function make_archetypes() {

    var first_arch_selected = "affluents";

    function get_archetype_bubble_id(archetype) { return archetype + "_archetype_map_bubble_id"; }

    function init_pop_map() {

        var ineq_map_svg = d3.select("#crime_ineq_selected_map"),
            margin = {top: 20, bottom: 20, left: 20, right: 20},
            width = ineq_map_svg.attr("width"),
            height = ineq_map_svg.attr("height");

        var x = d3.scaleLinear(),
            y = d3.scaleLinear(),
            r = d3.scaleSqrt().range([0, 20]),
            color = d3.scaleOrdinal(d3.schemeCategory10);

        var projection = d3.geoMercator()

        d3.json("static/data/chicago_centroid.json", function(neighb_data) {

            projection.fitExtent([[0, margin.bottom], [width, height - margin.top]], neighb_data)

            // plot chicago outline
            d3.json("static/data/chicago_outline.json", function(outline) {
                
                var path = d3.geoPath()
                    .projection(projection);

                ineq_map_svg.append("g")
                    .selectAll("path")
                    .data(outline.features)
                    .enter()
                    .append("path")
                    .attr("d", path)
                    .attr("stroke-width", "1")
                    .attr("fill", "none")
                    .attr("stroke", "black");

            });

            r.domain([0, d3.max(neighb_data.features.map(d => d.properties.population))]);
            color.domain(neighb_data.features.map(d => d.properties.primary_race));

            // Draw map
            ineq_map_svg.append("g")
                .selectAll("circle")
                .data(neighb_data.features)
                .enter()
                .append("circle")
                .attr("cx", d => projection(d.geometry.coordinates)[0])
                .attr("cy", d => projection(d.geometry.coordinates)[1])
                .attr("r", d => r(d.properties.population))
                .attr("fill", d => color(d.properties.primary_race))
                .attr("id", d => get_archetype_bubble_id(d.properties.archetype))
                .style("opacity", "0.3");

            // Draw race legend
            var ordinal = d3.scaleOrdinal()
                .domain(color.domain())
                .range(color.range());

            ineq_map_svg.append("g")
                .attr("class", "race_legend_ordinal")
                .attr("transform", "translate(" + (width - margin.right - 70) + "," + (margin.top/2) + ")");

            var legend_ordinal = d3.legendColor()
                .scale(ordinal)

            ineq_map_svg.select(".race_legend_ordinal")
                .call(legend_ordinal);

            // Draw population legend
            var pops_to_show = [ 10000, 70000 ];
            var linear_size = d3.scaleSqrt()
                .domain(pops_to_show)
                .range(pops_to_show.map(r));

            ineq_map_svg.append("g")
                .attr("class", "pop_size_legend")
                .attr("transform", "translate(" + 35 + "," + (height - 140) + ")");

            var legend_size = d3.legendSize()
                .scale(linear_size)
                .shape("circle")
                .cells(4)
                .shapePadding("3")
                .labelFormat(d => parseInt(d/1000) + "k")
                .labelOffset("5")
                .title("Population");

            ineq_map_svg.select(".pop_size_legend")
                .call(legend_size);

            // fix the offset
            d3.selectAll(".pop_size_legend").selectAll(".legendCells")
                .attr("transform", "translate(18, 5)")

            // initiate to click on first arch
            update_pop_map(first_arch_selected);
        });
    }

    function update_pop_map(type) {

        // set opacity of all
        d3.selectAll("#crime_ineq_selected_map")
            .selectAll("circle")
            .style("opacity", "0.3")

        // darken selected
        d3.selectAll("#crime_ineq_selected_map")
            .selectAll("#" + get_archetype_bubble_id(type))
            .transition()
            .style("opacity", "1.0");
    }

    function arch_tbl_cell_click() {

        d3.select("#crime_archetype_tbl")
            .selectAll(".archetype_selector_cell")
            .on("click", function(d) {
                var cell = d3.select(this)
                var type = cell.attr("id").split("_")[0];

                d3.select("#crime_archetype_tbl")
                        .selectAll("td")
                        .transition()
                        .style("background-color", null);

                cell.transition()
                    .style("background-color", "Gainsboro");
                
                update_pop_map(type);
                make_autotext(type);
            })

        // initiate to click on first arch
        d3.select("#crime_archetype_tbl")
            .select("#" + first_arch_selected + "_arch_cell")
            .style("background-color", "Gainsboro");
    }

    function make_autotext(type) {

        function get_weighted_values(val, arch_data) {

            var total_pop_pct = d3.sum(arch_data.map(d => d.pop_pct));

            var nested_values = d3.nest()
                .key(d => d[val])
                .rollup(leaves => d3.sum(leaves, d => d.pop_pct)/total_pop_pct)
                .entries(arch_data)
                .sort(function(a, b) { return d3.descending(a.value, b.value); });

            return nested_values;
        }

        function get_dominant_value_if_exists(val, arch_data) {
            var nested_values = get_weighted_values(val, arch_data);
            return nested_values[0].value > 0.5 ? nested_values[0].key : null;
        }

        function get_summary_autotext(arch_data) {

            var 
                // description of archetype
                arch_text = "<b>" + {'affluents' : 'Affluents', 'distressed' : 'Distressed', 'working' : 'Diverse Working Class'}[type] + "</b>",
                // change in population
                pop_chg_raw = get_weighted_values("population_change", arch_data),
                pop_chg_fcn = function() {
                    if(pop_chg_raw[0].value > 0.5 && pop_chg_raw[0].key != "flat")  {
                        return "<b>" + pop_chg_raw[0].key + "</b>"
                    } else if (pop_chg_raw[0].key == "flat") {
                        return "<b>slightly " + pop_chg_raw[1].key + "</b>"
                    } else {
                        return ""
                    }
                },
                pop_chg = pop_chg_fcn(),
                // size of population
                pop_pct = d3.sum(arch_data.map(d => d.pop_pct)),
                pop_size_descr = pop_pct > "0.4" ? "<b>large</b>, " + pop_chg : pop_chg,
                //pop_size_descr = pop_pct > "0.4" ? "<b>large</b>," : "",
                pop_size_number = "<b>" + Math.round(pop_pct*100) + "%</b>",
                // race composition
                race_raw = get_dominant_value_if_exists("primary_race", arch_data),
                race = race_raw == null ? "<b>mixed-race</b>" : "predominantly <b>" + race_raw + "</b>",
                // crime level
                crime_lvl_raw = get_weighted_values("crime_level", arch_data),
                crime_lvl_fcn = function() {
                    if(crime_lvl_raw[0].value > 0.6) {
                        return "<b>" + crime_lvl_raw[0].key + "</b>"
                    } else if (crime_lvl_raw[0].key == "normal") {
                        return "<b>moderate to " + crime_lvl_raw[1].key + "</b>"
                    } else if (crime_lvl_raw[1].key == "normal") {
                        return "<b>moderate to " + crime_lvl_raw[0].key + "</b>"
                    } else {
                        return "<b>varying intensity</b>"
                    }
                },
                crime_lvl = crime_lvl_fcn(),
                // income level
                income_raw = get_dominant_value_if_exists("income_class", arch_data),
                income = "<b>" + (income_raw == null ? "varying" : (income_raw == "medium" ? "moderate" : income_raw)) + "</b>",
                // income breakout
                // --> income change
                income_fcn = function(income_key) {
                    if(income_key == "flat") {
                        return "remained <b>flat</b>"
                    } else if (income_key == "large increase") {
                        return "<b>increased significantly</b>"
                    } else if (income_key == "increase") {
                        return "<b>increased moderately</b>"  
                    } else {
                        return "<b>" + income_key + "d</b>"
                    }
                },
                income_chg_raw = get_weighted_values("income_change", arch_data),
                income_chg_primary = income_fcn(income_chg_raw[0].key),
                income_chg_secondary= income_chg_raw.length > 1 ? "or " + income_fcn(income_chg_raw[1].key) : "", 
                // crime breakout
                // --> elevated category
                elevated_raw = get_weighted_values("elevated_category", arch_data).filter(d => d.key != "None"),
                elevated = "<b>" + elevated_raw[0].key + "</b>",
                // --> uptick
                uptick_raw = get_weighted_values("uptick", arch_data),
                uptick_pct = uptick_raw[0].key == "uptick" ? uptick_raw[0].value : (uptick_raw.length > 1 ? (uptick_raw[1].key == "uptick" ? uptick_raw[1].value : 0.0) : 0),
                uptick_text = uptick_pct > 0.1 ? "In the past 2 years, <b>" + Math.round(100*uptick_pct) + "%</b> of this group has experienced an uptick in crime. " : "",
                // --> any flat crime areas
                flat_raw = get_weighted_values("long_term_crime", arch_data),
                flat_pct = flat_raw[0].key == "flat" ? flat_raw[0].value : (flat_raw.length > 1 ? (flat_raw[1].key == "flat" ? flat_raw[1].value : 0.0) : 0),
                flat_text = flat_pct > 0.1 ? "Despite the dramatic crime decrease throughout the city, <b>" + Math.round(100*flat_pct) + "%</b> of the " + arch_text + " have seen little to no crime reduction since 2002. " : "",
                end = 1;

            var autotext = 
                "The " + arch_text + " experience " +
                crime_lvl + " crime levels with elevated " + elevated + " crime. " +
                flat_text +
                uptick_text +
                
                '<div style="line-height: 0.6em;"><br></div>' + 

                "The " + arch_text + (type == "working" ? " is a " : " are a ") + 
                pop_size_descr + ", " + race + " population in Chicago comprising " + pop_size_number + " of the city. " +
                "Incomes are " + income + ", and, after adjusting for inflation, have " + income_chg_primary + " " + income_chg_secondary + " since 2002."

            return autotext;
      
        }
        
        d3.json("static/data/chicago_centroid.json", function(neighb_data) {

            var arch_data = neighb_data.features.map(d => d.properties)
                .filter(d => d.archetype == type);

            d3.select("#archetype_autotext_div")
                .html(get_summary_autotext(arch_data));

        });

    }

    function init_autotext() {
        make_autotext(first_arch_selected);
    }

    init_pop_map();
    arch_tbl_cell_click();
    init_autotext();

}

make_archetypes();
