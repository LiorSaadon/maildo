module.exports = function() {

    var queryBuilder = require('./queryBuilder.js');
    var pagerHandler = require('./pageHandler.js');

    var select = function (ioManager, socket, data, MailModel) {

        var query = queryBuilder.buildQuery(data);

        MailModel.find(query, function(err, mails) {
            if(err){
                ioManager.emit(socket, 'mails:read', {"success":false});
            }else{
                var page = pagerHandler.filterByPage(mails, data);
                ioManager.emit(socket, 'mails:read', {"success":true,"data":{"collection":page.collection,"metadata":page.metadata}});
            }
        });
    };

    return{
        select:select
    }
}();
