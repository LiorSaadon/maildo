define(function (require) {
    'use strict';

    var jQuery = require('jquery');

    (function ($, window, document) {

        $.fn.toggleBlock = function(show) {

            this.css("display", show ? "block" : "none");

        };
    })(jQuery, window, document);
});
