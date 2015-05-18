module.exports = function() {

    var SettingsModel = require('./models/settingsModel.js');

    //------------------------------------------------------------
    // start
    //------------------------------------------------------------

    var start = function(db, app){

        var Settings = SettingsModel.create(db);
        require('./routers/routes.js')(app, Settings);
    };

    return{
        start:start
    }
}();

