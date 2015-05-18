module.exports = function() {

    var create = function(db){

        var UserSchema = new db.Schema({
            "email": String,
            "password":String
        });

        UserSchema.methods.validPassword = function(password) {
            return true
        };

        return db.model('User', UserSchema);
    };

    return {
        create:create
    };
}();

