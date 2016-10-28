function Dashboard() {
    var dt = new Date();
    var last = new Date(2016, 10, 9);
    this.city = 'Reno';
    this.date = dt;
    this.dates = [];
    while (dt < last) {
        var display = fecha.format(dt, 'ddd MM/DD');
        var ymd = fecha.format(dt, 'YYYY-MM-DD');
        this.dates.push(ymd);
        var el = '<li role="presentation" id="tab'+ymd+'" class="date" data="'+ymd+'"><a>'+display+'</a></li>';
        $('ul.nav-tabs').append(el);
        dt = new Date(dt.getTime()+24*60*60*1000);
    }
}

Dashboard.prototype.setup = function() {
    var self = this;
    $('#displayDate').text(fecha.format(this.date, 'ddd MM/DD'));
    $('.nav-tabs #tab'+fecha.format(this.date, 'YYYY-MM-DD')).addClass('active');
    $('.city').on('click', function() {
        self.setCity($(this).attr('data'));
    });
    $('.date').on('click', function() {
        self.setDate($(this).attr('data'));
    });
    $('#allEmailsButton').on('click', function() {
        $('.emails').show();
    });
    var people = $.ajax({
        url: 'https://lnrtmato2g.execute-api.us-east-1.amazonaws.com/live/airtable',
        data: { table: 'people' }
    });
    var today = fecha.format(this.date, 'YYYY-MM-DD');
    $.when(people).done(function(resp1) {
        $('#loading').hide();
        console.log('loaded people ', people);
        this.people = resp1.people;
        this.peopleByDate = {};
        this.dates.forEach(function(dt) {
            this.peopleByDate[dt] = [];
        }.bind(this));
        this.people.forEach(function(p) {
            // add to start and return
            this.addPersonToDate(p, p.start);
            this.addPersonToDate(p, p.return);
            var dt = fecha.parse(p.start, 'YYYY-MM-DD');
            dt.setDate(dt.getDate()+1);
            while (fecha.format(dt, 'YYYY-MM-DD') < p.return) {
                this.addPersonToDate(p, fecha.format(dt, 'YYYY-MM-DD'));
                dt.setDate(dt.getDate()+1);
            }
        }.bind(this));
        this.setupPeople();
        $('#content').show();
    }.bind(this));
};

Dashboard.prototype.addPersonToDate = function(person, ymd) {
    if (this.peopleByDate[ymd]) {
        this.peopleByDate[ymd].push(person);
    } else {
        console.log('skipping bad date: '+ymd, person);
    }
};

Dashboard.prototype.setupPeople = function() {
    var ymd = fecha.format(this.date, 'YYYY-MM-DD');
    var people = this.peopleByDate[ymd] || [];
    $('#peopleCount').text(people.length);
    var withEmails = people.filter(function(p) {
        return p.email;
    });
    var emails = withEmails.map(function(p) {
        return p.email;
    });
    $('#allEmailsList').text(emails.join(', '));
};

Dashboard.prototype.setDate = function(date) {
    console.log('date=', date);
    $('.emails').hide();
    this.date = fecha.parse(date, 'YYYY-MM-DD');
    $('.nav-tabs li').removeClass('active');
    $('.nav-tabs #tab'+fecha.format(this.date, 'YYYY-MM-DD')).addClass('active');
    $('#displayDate').text(fecha.format(this.date, 'ddd MM/DD'));
    this.setupPeople();
};

Dashboard.prototype.setCity = function(city) {
    console.log('city=', city);
    this.city = city;
    this.load();
};

Dashboard.prototype.load = function() {
    console.log('load '+this.date+' for '+this.city);
    // https://lnrtmato2g.execute.amazonaws.com/live/airtable
    // get from lambda
    /*
    email addresses by staging location
    count by staging location #
    unassigned
    */
};

$(document).ready(function() {
    var dashboard = new Dashboard();
    dashboard.setup();
});
