module.exports = function() {

    var queryBuilder = require('../get/queryBuilder.js');
    var pagerHandler = require('../get/pageHandler.js');
    var socketManager = require('../../../managers/socketManager');

    var select = function (socket, data, MailModel) {

        var query = queryBuilder.buildQuery(data);

        MailModel.find(query, function(err, mails) {

            if(err){
                console.log(err);
            }else{
                var page = pagerHandler.filterByPage(mails, data);
                socketManager.emit(socket, 'mails:read', {"success":true,"data":{"collection":page.collection,"metadata":page.metadata}});
            }
        });
    };

    return{
        select:select
    }
}();
