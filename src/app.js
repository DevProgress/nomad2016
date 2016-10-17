var mapsheet = null;

var setMapsheet = function(ms) {
    mapsheet = ms;
};

var showRides = function(rides) {
    var text = rides + ' ';
    text += rides === 1 ? 'ride' : 'rides';
    text += ' available on';
    $('#rides').text(text);
};

var filterByDate = function(yyyymmdd) {
    var total = 0;
    mapsheet.points.forEach(function(point) {
        var start = point.model['Start date and time'];  // "2016-10-29 05:30:00 -0000"
        var show = yyyymmdd === '' || yyyymmdd === start.substring(0, 10);
        if (show) {
            total += 1;
        }
        point.marker.setVisible(show);
    });
    showRides(total);
};

var setupDatePicker = function() {
    // add one option per day through 11/8/16
    var dt = new Date();
    var last = new Date(2016, 10, 9);
    while (dt < last) {
        var display = fecha.format(dt, 'dddd, MMMM D, YYYY');
        var ymd = fecha.format(dt, 'YYYY-MM-DD');
        $('#dateFilter').append('<option value="'+ymd+'">'+display+'</option>');
        dt = new Date(dt.getTime()+24*60*60*1000);
    }
    $('#dateFilter').on('change', function() {
        filterByDate($(this).val());
    });
};
