/**
 * Created with IntelliJ IDEA.
 * User: omerh
 * Date: 10/23/13
 * Time: 10:26 AM
 * To change this template use File | Settings | File Templates.
 */
define(function (require) {
    "use strict";


    var QUnitHelper = (function () {

        var getQueryString = function (param) {
            var urlStr = window.location.search.substring(1);
            var sv = urlStr.split("&");
            var ft;
            for (var i=0;i< sv.length;i++) {
                ft = sv [i].split("=");
                if (ft[0] === param) {
                    return ft[1];
                }
            }
        };
        return {
            getQueryString: function (param) {
                return getQueryString(param);
            }
        };

    }());
    return QUnitHelper;
});