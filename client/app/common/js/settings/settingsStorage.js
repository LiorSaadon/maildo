define(function (require) {
    "use strict";

    var SettingsStorage = function (_orderBy) {

        var _localStorage = window.localStorage;

        //-------------------------------------------------
        // update
        //-------------------------------------------------

        var update = function (model) {

            if(_.isObject(model)){
                _localStorage.setItem('settings', JSON.stringify(model));
                return {};
            }
            return {status:"error", message:'model not valid'};
        };

        //-------------------------------------------------
        // find
        //-------------------------------------------------

        var find = function (model,options) {

            var store = _localStorage.getItem('settings');
            return typeof(store) === 'string' ? JSON.parse(store) : {};
        };

        return{
            update: update,
            find: find
        };
    };

    return SettingsStorage;
});