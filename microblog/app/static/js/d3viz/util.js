
// For every column in the csv, create a timeseries of the value in the column
// This is similar to nest but allows time preprocessing (since nest will convert the time to a string)
function csv_timeseries_col_split(csv_data, cols_to_plot) {
    return Object.keys(csv_data[0]).filter(key => cols_to_plot.indexOf(key) >= 0).map(function(id) {
        return {
            id     : id,
            values : csv_data.map(function(d) { return { time : d.time, value : d[id] }; })
        };
    });
}
