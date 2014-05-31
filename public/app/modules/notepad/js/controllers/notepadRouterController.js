define(function (require) {
    "use strict";

    var app = require("mbApp");

    var NotepadRouterController = {};

    app.module('notepad', function (notepad, mb,  Backbone, Marionette, $, _) {

        NotepadRouterController = Marionette.Controller.extend({


            //-----------------------------------------------------------------
            //  actions
            //-----------------------------------------------------------------

            newNote:function(){
                app.context.set("router.state",{'action':'newNote'});
            }
        });
    });
    return NotepadRouterController;
});
