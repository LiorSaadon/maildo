define(function (require) {
    "use strict";

    var Guid = (function () {

        function S4() {
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        }

        function create() {
            return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
        }

        return {
            create: create
        };
    }());

    return Guid;
});
