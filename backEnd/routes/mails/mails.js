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

    var addItem = function(req, res){
        addItemModule.add(req, res, MailModel);
    };

    //--------------------------------------------------

    var deleteItem = function(req, res){
        deleteItemModule.deleteItem(req, res, MailModel);
    };

    //--------------------------------------------------

    var deleteBulk = function(req, res){
        deleteBulkModule.deleteBulk(req, res, MailModel);
    };

    //--------------------------------------------------

    var getList = function(req, res){
        getListModule.select(req, res, MailModel);
    };

    return{
        setModel:setModel,
        addItem:addItem,
        getList:getList,
        deleteBulk:deleteBulk
    }
}();

