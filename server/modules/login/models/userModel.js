module.exports = function() {

    var bcrypt = require('bcrypt-nodejs');

    var create = function(db){

        var UserSchema = new db.Schema({
            "username": String,
            "password": String
        }, { collection: 'users' });


        UserSchema.methods.generateHash = function(password) {
            return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
        };

        UserSchema.methods.validPassword = function(password) {
            return bcrypt.compareSync(password, this.password);
        };

        return db.model('User', UserSchema);
    };

    return {
        create:create
    };
}();

