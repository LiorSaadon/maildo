module.exports = function() {

    var select = function (req, res, MailModel) {

        MailModel.find({}, function(error, mails) {
            res.send({"collection":mails,"metadata":{}});
        });
    };

    //-----------------------------------------------------

    return{
        select:select
    }
}();

