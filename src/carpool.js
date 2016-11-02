function Carpool() {
    this.carpoolTemplate = Handlebars.compile($('#carpool').html());
    this.token = (new RegExp('token=(.*?)&')).exec(window.location.href)[1];
    this.carpoolId = (new RegExp('id=(.*)')).exec(window.location.href)[1];
    this.request = {
        url: 'https://lnrtmato2g.execute-api.us-east-1.amazonaws.com/live/carpool/'+this.carpoolId,
        headers: { 'x-api-key': this.token }
    };
    $('#save').on('click', this.save.bind(this));
}

Carpool.prototype.save = function() {
    console.log('save');
    $('#status').hide();
    var startDate = $('input[name="startDate"]:checked').val();
    var returnDate = $('input[name="returnDate"]:checked').val();
    var canvassDays = [];
    $('input[name="canvassDays"]:checked').each(function() {
        canvassDays.push($(this).val());
    });
    var message = null;
    if (canvassDays.length) {
        if (canvassDays[0] < startDate) {
            message = 'First canvass day cannot be before you get there.';
        }
        if (canvassDays[canvassDays.length-1] > returnDate) {
            message = 'Last canvass day cannot be after you leave.';
        }
    } else {
        message = 'No canvass days selected.';
    }
    if (message) {
        $('#status').html('<div class="alert alert-danger" role="alert">'+message+'</div>');
        $('#status').show();
    } else {
        // keep the time
        var start = startDate;
        var startTime = '00:00';
        if (this.carpool.start) {
            startTime = this.carpool.start.split(' ')[1];
        }
        var ret = returnDate;
        returnTime = '23:59';
        if (this.carpool.return) {
            returnTime = this.carpool.return.split(' ')[1];
        }
        var data = {
            action: 'update carpool',
            start: start+' '+startTime,
            return: ret+' '+returnTime,
            canvass: canvassDays
        };
        $.ajax(_.extend({
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data)
        }, this.request)).then(function(response) {
            $('#status').html('<div class="alert alert-success" role="alert">Thanks for the update. See you in Reno!</div>');
            $('#status').show();
        });
    }
};

Carpool.prototype.setup = function() {
    $.ajax(this.request).then(function(response) {
        this.carpool = response.carpool;
        var days = this.carpool.days || [];
        var canvassDays = days.map(function(day) {
            console.log(day);
            var dt = fecha.parse(day, 'YYYY-MM-DD');
            return fecha.format(dt, 'ddd MM/DD');
        });
        $('#reason').html(response.carpool.invalid);
        var s = this.carpool.start || '2016-11-01';
        var start = fecha.parse(s, 'YYYY-MM-DD');
        var startYmd = fecha.format(start, 'YYYY-MM-DD');
        var r = this.carpool.return || '2016-11-09';
        var ret = fecha.parse(r, 'YYYY-MM-DD');
        var returnYmd = fecha.format(ret, 'YYYY-MM-DD');
        var data = {
            start: fecha.format(start, 'ddd MM/DD'),
            return: fecha.format(ret, 'ddd MM/DD'),
            canvass: canvassDays.join(', ')
        };
        var startDays = [];
        var canvassDays = [];
        var returnDays = [];
        var last = new Date(2016, 10, 9);
        var dt = new Date();
        while (dt < last) {
            var dates = {
                ymd: fecha.format(dt, 'YYYY-MM-DD'),
                label: fecha.format(dt, 'ddd MM/DD')
            };
            var day = fecha.format(dt, 'ddd MM/DD');
            startDays.push(_.extend({checked: startYmd === dates.ymd}, dates));
            canvassDays.push(_.extend({checked: data.canvass.indexOf(day) >= 0}, dates));
            returnDays.push(_.extend({checked: returnYmd === dates.ymd}, dates));
            dt = new Date(dt.getTime()+24*60*60*1000);
        }
        // return after last day
        var dates = {
            ymd: fecha.format(dt, 'YYYY-MM-DD'),
            label: fecha.format(dt, 'ddd MM/DD')
        };
        returnDays.push(_.extend({checked: false}, dates));
        data['startDays'] = startDays;
        data['canvassDays'] = canvassDays;
        data['returnDays'] = returnDays;
        $('#carpoolDates').html(this.carpoolTemplate(data));
        $('#loading').hide();
        $('#content').show();
    }.bind(this));
};

$(document).ready(function() {
    var carpool = new Carpool();
    carpool.setup();
});
