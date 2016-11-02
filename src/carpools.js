function Carpools() {
    this.carpoolTemplate = Handlebars.compile($('#carpool').html());
    this.token = (new RegExp('token=(.*)')).exec(window.location.href)[1];
    this.request = {
        url: 'https://lnrtmato2g.execute-api.us-east-1.amazonaws.com/live/airtable',
        headers: { 'x-api-key': this.token },
        data: { table: 'carpools' }
    };
}

Carpools.prototype.setup = function() {
    $.ajax(this.request).then(function(response) {
        var invalid = [];
        Object.keys(response.carpools).forEach(function(cpid) {
            var carpool = response.carpools[cpid];
            if (carpool.invalid) {
                invalid.push(_.extend({id: cpid}, carpool));
            }
        });
        $('ul').html(this.carpoolTemplate({carpools: invalid}));
        $('#loading').hide();
        $('#content').show();
    }.bind(this));
};

$(document).ready(function() {
    var carpools = new Carpools();
    carpools.setup();
});
