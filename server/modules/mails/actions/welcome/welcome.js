module.exports = function(app) {

    var _ = require("underscore");
    var shortId = require('shortid');
    var welcomeMails = require('../../data/welcome.json');

    var addItems = function (user, MailModel) {

        _.each(welcomeMails, function(mail){
             addItem(user, MailModel,mail);
        });
    };

    //-----------------------------------------------------

    var addItem = function(user, Model, mail){

        var _mail = new Model(mail);

        _mail.userId = user._id;
        _mail.id = "_" + shortId.generate();
        _mail.from = "maildo@maildo.com";
        _mail.sentTime = (new Date()).getTime();
        _mail.labels = {unread: true, starred: true, important: true};
        _mail.groups = ['inbox'];

        _mail.save(function (err) {
            if (err) {
                console.log("welcome:addItem has failed." + mail);
            }
        });
    };

    //-----------------------------------------------------

    return{
        addItems:addItems
    };
}();

