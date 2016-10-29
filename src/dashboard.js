function Dashboard() {
    var dt = new Date();
    var last = new Date(2016, 10, 9);
    this.city = 'Reno';
    this.date = dt;
    this.ymd = fecha.format(this.date, 'YYYY-MM-DD');
    this.dates = [];
    while (dt < last) {
        var display = fecha.format(dt, 'ddd MM/DD');
        var ymd = fecha.format(dt, 'YYYY-MM-DD');
        this.dates.push(ymd);
        var el = '<li role="presentation" id="tab'+ymd+'" class="date" data="'+ymd+'"><a>'+display+'</a></li>';
        $('ul.nav-tabs').append(el);
        dt = new Date(dt.getTime()+24*60*60*1000);
    }
    this.carpoolTemplate = Handlebars.compile($('#carpool').html());
    this.stagingColumnsTemplate = Handlebars.compile($('#stagingColumns').html());
}

Dashboard.prototype.setup = function() {
    var self = this;
    $('#displayDate').text(fecha.format(this.date, 'ddd MM/DD'));
    $('.nav-tabs #tab'+this.ymd).addClass('active');
    $('.city').on('click', function() {
        self.setCity($(this).attr('data'));
    });
    $('.date').on('click', function() {
        self.setDate($(this).attr('data'));
    });
    $('#allEmailsButton').on('click', function() {
        $('.emails').show();
    });
    var API = 'https://lnrtmato2g.execute-api.us-east-1.amazonaws.com/live/airtable';
    var token = (new RegExp('token=(.*)')).exec(window.location.href)[1];
    var people = $.ajax({
        url: API,
        data: { table: 'people', token: token }
    });
    var staging = $.ajax({
        url: API,
        data: { table: 'staging', token: token }
    });
    var carpools = $.ajax({
        url: API,
        data: { table: 'carpools', token: token }
    });
    var today = this.ymd;
    $.when(people, staging, carpools).done(function(peopleResp, stagingResp, carpoolsResp) {
        $('#loading').hide();
        console.log('loaded people ', peopleResp);
        /*
            "person123": {
                "email": "user@test.com"
            }
        */
        this.people = peopleResp[0].people;

        /*
            "recEi8nw4mFXyXbnN": {
                "city": "Reno",
                "location": "Terminal",
                "people": ["recwWeIYuawogM77b", "recOT04eLeZ7IXVZ3"]
            }
        */

        this.staging = stagingResp[0].staging;
        // remove None 
        if ('recMG5pKfvcu3vnDI' in this.staging) {
            delete this.staging.recMG5pKfvcu3vnDI;
        }

        /*
            "recTHiQkEWipln5y0": {
                "days": ["2016-11-07", "2016-11-06"],
                "name": "  - CPID374",
                "people": ["recwWeIYuawogM77b", "recOT04eLeZ7IXVZ3"]
            }
        */
        this.carpools = carpoolsResp[0].carpools;

        this.peopleByDate = {};
        this.dates.forEach(function(ymd) {
            // get people in a carpool with the canvass day ymd
            this.peopleByDate[ymd] = [];
            Object.keys(this.carpools).forEach(function(id) {
                var carpool = this.carpools[id];
                if (carpool.days.indexOf(ymd) >= 0) {
                    this.peopleByDate[ymd] = this.peopleByDate[ymd].concat(carpool.people);
                }
            }.bind(this));
        }.bind(this));
        this.setContent();
        $('#content').show();
    }.bind(this));
};

Dashboard.prototype.emailList = function(peopleIds) {
    var emails = peopleIds.map(function(id) {
        return this.people[id].email;
    }.bind(this));
    _.pull(emails, '');
    return emails.join(', ');
};

Dashboard.prototype.addPersonToDate = function(person, ymd) {
    if (this.peopleByDate[ymd]) {
        this.peopleByDate[ymd].push(person.id);
    } else {
        console.log('skipping bad date: '+ymd, person);
    }
};

Dashboard.prototype.setContent = function() {
    this.setupPeople();
    this.setupStaging();
    this.setupUnassigned();
};

Dashboard.prototype.setupUnassigned = function() {
    var assigned = [];
    Object.keys(this.staging).forEach(function (id) {
        var loc = this.staging[id];
        assigned = assigned.concat(loc.people);
    }.bind(this));
    var unassigned = _.reject(this.peopleByDate[this.ymd], function(id) {
        return assigned.indexOf(id) >= 0;
    });
    // get carpools for these people
    var carpools = [];
    Object.keys(this.carpools).forEach(function(id) {
        // carpool member is unassigned
        var carpool = this.carpools[id];
        var hasUnassigned =_.find(carpool.people, function(personId) {
            return unassigned.indexOf(personId) >= 0;
        });
        if (hasUnassigned) {
            carpools.push({
                id: id,
                name: carpool.name,
                numPeople: carpool.people.length
            });
        }
    }.bind(this));
    $('#unassigned').html(this.carpoolTemplate({carpools: carpools}));
    $('.carpool').on('dragstart', function(ev) {
        ev.dataTransfer.setData('text', ev.target.id);
    });
};

Dashboard.prototype.setupPeople = function() {
    var peopleIds = this.peopleByDate[this.ymd];
    $('#peopleCount').text(peopleIds.length);
    $('#allEmailsList').text(this.emailList(peopleIds));
};

Dashboard.prototype.setupStaging = function() {
    var byName = _.sortBy(Object.keys(this.staging), function(id) {
        return this.staging[id].location;
    }.bind(this));
    var locations = [];
    // all people here on this date
    var dayPeopleIds = this.peopleByDate[this.ymd];
    byName.forEach(function(id) {
        var loc = this.staging[id];
        var peopleIds = _.intersection(dayPeopleIds, loc.people);
        var pct = 'n/a';
        if (dayPeopleIds.length) {
            pct = Math.round(peopleIds.length / dayPeopleIds.length * 100);
        }
        locations.push({
            location: loc.location,
            percent: pct,
            people: peopleIds.length,
            peopleLabel: peopleIds.length === 1 ? 'person' : 'people',
            emails: this.emailList(peopleIds)
        });
    }.bind(this));
    $('#locations').html(this.stagingColumnsTemplate({locations: locations}));
    $('.location').on('dragover', function(ev) {
        ev.preventDefault();
    });
    $('.location').on('drop', function(ev) {
        console.log('drop ', ev);
    });
};

Dashboard.prototype.setDate = function(date) {
    console.log('date=', date);
    $('.emails').hide();
    this.date = fecha.parse(date, 'YYYY-MM-DD');
    this.ymd = fecha.format(this.date, 'YYYY-MM-DD');
    $('.nav-tabs li').removeClass('active');
    $('.nav-tabs #tab'+this.ymd).addClass('active');
    $('#displayDate').text(fecha.format(this.date, 'ddd MM/DD'));
    this.setContent();
};

$(document).ready(function() {
    var dashboard = new Dashboard();
    dashboard.setup();
});
