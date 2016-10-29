[function Dashboard() {
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
    var people = $.ajax({
        url: 'https://lnrtmato2g.execute-api.us-east-1.amazonaws.com/live/airtable',
        data: { table: 'people' }
    });
    var staging = $.ajax({
        url: 'https://lnrtmato2g.execute-api.us-east-1.amazonaws.com/live/airtable',
        data: { table: 'staging' }
    });
    var today = this.ymd;
    $.when(people, staging).done(function(peopleResp, stagingResp) {
        $('#loading').hide();
        console.log('loaded people ', peopleResp);
        this.people = {};
        this.peopleByDate = {};
        this.staging = {};
        this.stagingByDate = {};
        this.dates.forEach(function(dt) {
            this.peopleByDate[dt] = [];
        }.bind(this));
        /*
        {
            "person123": {
                "id": "person123",
                "start": "2016-10-28",
                "return": "2016-10-30"
            }
        }
        */
        peopleResp[0].people.forEach(function(p) {
            this.people[p.id] = p;
        }.bind(this));
        Object.keys(this.people).forEach(function(id) {
            var p = this.people[id];
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

        console.log('staging=', this.staging);
        /*
        {
            "city": "Reno",
            "id": "recEi8nw4mFXyXbnN",
            "location": "Terminal",
            "people": ["recd0lh1vxzcjUQGN", "recPeOmqalv0iJaGc", ...]
        }
        */
        stagingResp[0].staging.forEach(function(s) {
            this.staging[s.id] = s;
        }.bind(this));
        Object.keys(this.staging).forEach(function(id) {
            var loc = this.staging[id];
            this.stagingByDate[loc.id] = {};
            this.dates.forEach(function(dt) {
                // loc.people is array of people ids
                // this.peopleByDate[dt] is array of people ids
                this.stagingByDate[loc.id][dt] = _.intersection(loc.people, this.peopleByDate[dt]);
            }.bind(this));
        }.bind(this));
        this.setupStaging();

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

Dashboard.prototype.setupPeople = function() {
    var ymd = fecha.format(this.date, 'YYYY-MM-DD');
    var peopleIds = this.peopleByDate[this.ymd] || [];
    $('#peopleCount').text(peopleIds.length);
    $('#allEmailsList').text(this.emailList(peopleIds));
};

Dashboard.prototype.setupStaging = function() {
    $('.staging tbody').empty();
    var byName = _.sortBy(Object.keys(this.staging), function(id) {
        return this.staging[id].location;
    }.bind(this));
    byName.forEach(function(id) {
        var loc = this.staging[id];
        var people = this.stagingByDate[loc.id][this.ymd];
        var pct = '';
        if (this.peopleByDate[this.ymd].length) {
            pct = Math.round(people.length / this.peopleByDate[this.ymd].length * 100);
        }
        var row = '<tr>'+
            '<td>'+loc.location+'</td>\n'+
            '<td class="number">'+people.length+'</td>\n'+
            '<td class="number">'+pct+'%</td>\n'+
            '<td>'+this.emailList(people)+'</td>\n'+
            '</tr>';
        $('tbody').append(row);
    }.bind(this));
};

Dashboard.prototype.setDate = function(date) {
    console.log('date=', date);
    $('.emails').hide();
    this.date = fecha.parse(date, 'YYYY-MM-DD');
    this.ymd = fecha.format(this.date, 'YYYY-MM-DD');
    $('.nav-tabs li').removeClass('active');
    $('.nav-tabs #tab'+ymd).addClass('active');
    $('#displayDate').text(fecha.format(this.date, 'ddd MM/DD'));
    this.setupPeople();
    this.setupStaging();
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
