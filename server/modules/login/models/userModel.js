module.exports = function() {

    var bcrypt = require('bcrypt-nodejs');

    var create = function(db){

        var UserSchema = new db.Schema({
            "email": String,
            "password":String
        });


        UserSchema.methods.generateHash = function(password) {
            return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
        };

        UserSchema.methods.validPassword = function(password) {
            return bcrypt.compareSync(password, this.local.password);
        };

        return db.model('User', UserSchema);
    };

    return {
        create:create
    };
}();

