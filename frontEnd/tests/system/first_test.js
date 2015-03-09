var async = require("async"),
    assert = require("assert"),
    webdriver = require("selenium-webdriver"),
    test = require("selenium-webdriver/testing");


async.each(['internet_explorer'],function(browser){ //'chrome','firefox',

    test.describe("Google Search", function() {
        this.timeout(15000);
        var driver;

        test.beforeEach(function(){
            var capabilities = {
                'browserName' : browser,
                'chromeOptions': {
                    args: ['--test-type']
                }
            };
            driver = new webdriver.Builder().withCapabilities(capabilities).build();
        });

        test.afterEach(function(){
            driver.quit();
        });

        test.it("should work", function(done) {

            driver.get("http://mailbone:92/index.html");
            driver.sleep(1000);

            driver.findElement({className:'search-input'}).sendKeys("webdriver");
            driver.sleep(1000);

            driver.findElement({className:'btnSearch'}).click();
            driver.sleep(1000);

            driver.findElement({className:'btnCompose'}).click();
            driver.sleep(1000);

            driver.getTitle().then(function(title) {
                assert.equal("mailbone", title);
            });
            driver.sleep(1000);
        });
    });
});
