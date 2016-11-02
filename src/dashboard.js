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
    this.dropZoneTemplate = Handlebars.compile($('#dropZones').html());
    this.token = (new RegExp('token=(.*)')).exec(window.location.href)[1];
    this.request = {
        url: 'https://lnrtmato2g.execute-api.us-east-1.amazonaws.com/live/airtable',
        headers: { 'x-api-key': this.token }
    };
}

Dashboard.prototype.setup = function() {
    $('#displayDate').text(fecha.format(this.date, 'ddd MM/DD'));
    $('.nav-tabs #tab'+this.ymd).addClass('active');
    var self = this;
    $('.city').on('click', function() {
        self.setCity($(this).attr('data'));
    });
    $('.date').on('click', function() {
        self.setDate($(this).attr('data'));
    });
    $('#allEmailsButton').on('click', function() {
        $('.emails').show();
    });
    var people = $.ajax(_.extend({ data: { table: 'people' } }, this.request));
    var staging = $.ajax(_.extend({ data: { table: 'staging' } }, this.request));
    var carpools = $.ajax(_.extend({ data: { table: 'carpools' } }, this.request));
    var today = this.ymd;
    $.when(people, staging, carpools).done(function(peopleResp, stagingResp, carpoolsResp) {
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
        if (document.location.href.indexOf('test=true') < 0) {
            if ('recMG5pKfvcu3vnDI' in this.staging) {
                delete this.staging.recMG5pKfvcu3vnDI;
            }
        }
        this.stagingbyName = _.sortBy(Object.keys(this.staging), function(id) {
            return this.staging[id].location;
        }.bind(this));
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
        this.draw();
        $('#loading').hide();
        $('#content').show();
    }.bind(this));
};

Dashboard.prototype.emailList = function(peopleIds) {
    var emails = peopleIds.map(function(id) {
        return this.people[id] ? this.people[id].email : '';
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

Dashboard.prototype.draw = function() {
    this.drawPeople();
    $('#content').show();
    this.drawStaging();
    this.drawUnassigned();
};

Dashboard.prototype.drawUnassigned = function() {
    var assigned = [];
    Object.keys(this.staging).forEach(function (id) {
        var loc = this.staging[id];
        assigned = assigned.concat(loc.people || []);
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
        ev.originalEvent.dataTransfer.setData('text', ev.target.id);
        ev.originalEvent.dataTransfer.dropEffect = 'move';
    });
};

Dashboard.prototype.drawPeople = function() {
    var peopleIds = this.peopleByDate[this.ymd];
    $('#peopleCount').text(peopleIds.length);
    $('#allEmailsList').text(this.emailList(peopleIds));
};

Dashboard.prototype.drawStaging = function(tableOnly) {
    var locations = [];
    // all people here on this date
    var dayPeopleIds = this.peopleByDate[this.ymd];
    this.stagingbyName.forEach(function(id) {
        var loc = this.staging[id];
        var peopleIds = _.intersection(dayPeopleIds, loc.people || []);
        var pct = 'n/a';
        if (dayPeopleIds.length) {
            pct = Math.round(peopleIds.length / dayPeopleIds.length * 100);
        }
        locations.push({
            id: id,
            location: loc.location,
            percent: pct,
            people: peopleIds.length,
            peopleLabel: peopleIds.length === 1 ? 'person' : 'people',
            emails: this.emailList(peopleIds)
        });
    }.bind(this));
    $('#locations').html(this.stagingColumnsTemplate({locations: locations}));
    if (tableOnly) {
        return;
    }
    $('#carpoolDropZones').html(this.dropZoneTemplate({locations: locations}));
    $('.drop-zone').on('dragover', function(ev) {
        ev.preventDefault();
    });
    $('.drop-zone').on('drop', function(ev) {
        var carpoolId = ev.originalEvent.dataTransfer.getData('text');
        var carpool = this.carpools[carpoolId];
        var peopleIds = carpool.people;
        var locationId = $(ev.target).attr('data');
        // move label
        $('#'+carpoolId).appendTo($(ev.target).find('.added'));
        $(ev.target).find('.pending').show();
        // add people to location
        $.ajax(_.extend({
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ location: locationId, people: peopleIds})
        }, this.request)).then(function(response) {
            $(ev.target).find('.pending').hide();
            $('#'+carpoolId).text($('#'+carpoolId).text()+' added.');
            setTimeout(function() {
                $('#'+carpoolId).remove();
            }, 3000);
            // update staging
            var staging = response.staging;
            var stagingId = Object.keys(staging)[0];
            this.staging[stagingId] = response.staging[stagingId];
            // redraw staging
            this.drawStaging(true);
        }.bind(this));
    }.bind(this));
};

Dashboard.prototype.setDate = function(date) {
    console.log('date=', date);
    $('.emails').hide();
    this.date = fecha.parse(date, 'YYYY-MM-DD');
    this.ymd = fecha.format(this.date, 'YYYY-MM-DD');
    $('.nav-tabs li').removeClass('active');
    $('.nav-tabs #tab'+this.ymd).addClass('active');
    $('#displayDate').text(fecha.format(this.date, 'ddd MM/DD'));
    this.draw();
};

$(document).ready(function() {
    var dashboard = new Dashboard();
    dashboard.setup();
});
