/**
 * Created with IntelliJ IDEA.
 * User: efim
 * Date: 4/25/13
 * Time: 9:41 PM
 */

var launcherQUnit = {
    _v : 1.0,
    initCnt : 0,
    init : function () {
        var that = this;
        if (typeof(QUnit)=='undefined') {
            this.initCnt++;
            if (this.initCnt > 20) {
                return;
            }
            setTimeout(function () {
                    that._bindToQunit();
                }, 10);
            return;
        }
        this._bindToQunit();
    },
    _bindToQunit : function () {
        var that = this;
        QUnit.testDone(function( details ) {
            //console.log( "Finished running: ", details.module, details.name, "Failed/total: ", details.failed, details.total, details.duration );
            that._sendMessage({
                "url" : document.location.href,
                "type" : "test_done",
                "details" : details
            });
        });
        QUnit.done(function( details ) {
            //console.log( "Total: ", details.total, " Failed: ", details.failed, " Passed: ", details.passed, " Runtime: ", details.runtime );
            that._sendMessage({
                "url" : document.location.href,
                "type" : "qunit_done",
                "details" : details
            });
        });
    },
    _sendMessage : function (json, el) {
        if (!el) {
            el = parent;
        }
        el.postMessage(JSON.stringify(json),'*');
    }
};

launcherQUnit.init();