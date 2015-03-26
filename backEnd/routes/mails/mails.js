module.exports = function() {

    var getListModule = require('../mails/get/getList.js');
    var addItemModule = require('../mails/add/addItem.js');
    var deleteItemModule = require('../mails/delete/deleteItem.js');
    var deleteBulkModule = require('../mails/delete/deleteBulk.js');
    var updateBulkModule = require('../mails/update/updateBulk.js');

    var MailModel = null;

    //--------------------------------------------------

    var setModel = function(_MailModel){
        MailModel = _MailModel;
    };

    //--------------------------------------------------

    var addItem = function(socket, userName,data){
        addItemModule.add(socket, userName, data, MailModel);
    };

    //--------------------------------------------------

    var deleteItem = function(socket, userName, data){
        deleteItemModule.deleteItem(socket, userName, data, MailModel);
    };

    //--------------------------------------------------

    var deleteBulk = function(socket, userName, data){
        deleteBulkModule.deleteBulk(socket, userName, data, MailModel);
    };

    //--------------------------------------------------

    var updateBulk = function(socket, userName,  data){
        updateBulkModule.updateBulk(socket, userName, data, MailModel);
    };

    //--------------------------------------------------

    var getList = function(socket, data){
        getListModule.select(socket, data, MailModel);
    };

    return{
        setModel:setModel,
        addItem:addItem,
        getList:getList,
        deleteItem:deleteItem,
        deleteBulk:deleteBulk,
        updateBulk:updateBulk
    }
}();

