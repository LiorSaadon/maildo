module.exports = function() {

    var select = function (req, res, MailModel) {

        console.log("before select.....")

        MailModel.find({}, function(error, mails) {
            res.send(mails);
            console.dir(mails);
        });
    };

    //-----------------------------------------------------

    return{
        select:select
    }
}();

