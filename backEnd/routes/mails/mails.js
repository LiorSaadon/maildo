module.exports = function() {

    var getListModule = require('../mails/get/getList.js');
    var addItemModule = require('../mails/add/addItem.js');
    var deleteItemModule = require('../mails/delete/deleteItem.js');
    var deleteBulkModule = require('../mails/delete/deleteBulk.js');

    var MailModel = null;

    //--------------------------------------------------

    var setModel = function(_MailModel){
        MailModel = _MailModel;
    };

    //--------------------------------------------------

    var addItem = function(io, data){
        addItemModule.add(io, data, MailModel);
    };

    //--------------------------------------------------

    var deleteItem = function(io, data){
        deleteItemModule.deleteItem(io, data, MailModel);
    };

    //--------------------------------------------------

    var deleteBulk = function(io, data){
        deleteBulkModule.deleteBulk(io, data, MailModel);
    };

    //--------------------------------------------------

    var getList = function(io, data){
        getListModule.select(io, data, MailModel);
    };

    return{
        setModel:setModel,
        addItem:addItem,
        getList:getList,
        deleteItem:deleteItem,
        deleteBulk:deleteBulk
    }
}();

