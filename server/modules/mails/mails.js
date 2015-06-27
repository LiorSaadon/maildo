module.exports = function() {

    var getList    = require('./actions/get/getList.js');
    var addItem    = require('./actions/add/addItem.js');
    var deleteItem = require('./actions/delete/deleteItem.js');
    var deleteBulk = require('./actions/delete/deleteBulk.js');
    var updateBulk = require('./actions/update/updateBulk.js');
    var updateItem = require('./actions/update/updateItem.js');
    var model      = require('./models/mailModel.js');

    var MailModel;

    //--------------------------------------------------------
    // start
    //--------------------------------------------------------

    var start = function(db, app){

         MailModel = model.create(db);

        app.get("emitter").on('new-user',function(user){
            console.log("Emit works....\n\n");
        });
    };

    //--------------------------------------------------------
    // addListeners
    //--------------------------------------------------------

    var addListeners = function(ioManager, socket){

        socket.on('mail:create', function (userName, data) {
            addItem.add(ioManager, socket, userName, data, MailModel);
        });

        socket.on('mail:delete', function (userName, data) {
            deleteItem.deleteItem(ioManager, socket, userName, data, MailModel);
        });

        socket.on('mails:read', function (userName, data) {
            getList.select(ioManager, socket, data, MailModel);
        });

        socket.on('mails:delete', function (userName, data) {
            deleteBulk.deleteBulk(ioManager, socket, userName, data, MailModel);
        });

        socket.on('mail:update', function (userName, data) {
            updateItem.updateItem(ioManager, socket, userName, data, MailModel);
        });

        socket.on('mails:update', function (userName, data) {
            updateBulk.updateBulk(ioManager, socket, userName, data, MailModel);
        });
    };

    return{
        start:start,
        addListeners:addListeners
    };
}();

