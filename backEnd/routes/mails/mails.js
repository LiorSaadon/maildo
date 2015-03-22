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

    var addItem = function(userName,data){
        addItemModule.add(userName, data, MailModel);
    };

    //--------------------------------------------------

    var deleteItem = function(userName, data){
        deleteItemModule.deleteItem(userName, data, MailModel);
    };

    //--------------------------------------------------

    var deleteBulk = function(userName, data){
        deleteBulkModule.deleteBulk(userName, data, MailModel);
    };

    //--------------------------------------------------

    var updateBulk = function(io, data){
        updateBulkModule.updateBulk(io, data, MailModel);
    };

    //--------------------------------------------------

    var getList = function(userName, data){
        getListModule.select(userName, data, MailModel);
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

