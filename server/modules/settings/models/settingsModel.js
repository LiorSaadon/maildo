module.exports = function() {

    var create = function(db){

        var SettingsSchema = new db.Schema({
            "email":String,
            "theme": String,
            "lang":String
        });

        return db.model('Settings', SettingsSchema);
    };

    return {
        create:create
    };
}();

