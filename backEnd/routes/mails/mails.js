module.exports = function() {

    var getListModule = require('../mails/get/getList.js');
    var addItemModule = require('../mails/add/addItem.js');
//    var deleteItemModule = require('../mails/delete/deleteItem.js');
//    var deleteBulkModule = require('../mails/delete/deleteBulk.js');

    var MailModel = null;

    //--------------------------------------------------

    var setModel = function(_MailModel){
        MailModel = _MailModel;
    };

    //--------------------------------------------------

    var addItem = function(io, data){
        addItemModule.add(io, data, MailModel);
    };

//    //--------------------------------------------------
//
//    var deleteItem = function(req, res){
//        deleteItemModule.deleteItem(req, res, MailModel);
//    };
//
//    //--------------------------------------------------
//
//    var deleteBulk = function(req, res){
//        deleteBulkModule.deleteBulk(req, res, MailModel);
//    };

    //--------------------------------------------------

    var getList = function(io, data){
        getListModule.select(io, data, MailModel);
    };

    return{
        setModel:setModel,
        addItem:addItem,
        getList:getList
        //deleteBulk:deleteBulk
    }
}();

