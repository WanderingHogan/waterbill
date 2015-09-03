var Nightmare = require('nightmare');
var csv = require('fast-csv');
var fs = require('fs');

var addresses = ['1315 Webster', '5 N CALVERT']
//
var runNext = function(addressArray) {
  if (addressArray.length > 0) {
    console.log('working on ', `${addressArray[0]}`)
    new Nightmare({
        loadImages: false,
      })
      .goto('http://cityservices.baltimorecity.gov/water')
      .type('input[title="Service Address"]', `${addressArray[0]}`)
      .click('input[name="ctl00$ctl00$rootMasterContent$LocalContentPlaceHolder$btnGetInfoServiceAddress"]')
      .wait()
      .evaluate(function() {
        return document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_pnlBillDetail').innerText;
      }, function(result) {
        var kvpOut = {};
        kvpOut['ScrapeTime'] = new Date();
        if (result) {
          result.split("\n").forEach(function(x) {
            var arr = x.split(':\t');
            arr[1] && (kvpOut[arr[0]] = arr[1]);
          });
        } else {
          kvpOut['Service Address'] = addressArray[0];
          kvpOut['note'] = 'Parse Failed';
        }
        fs.appendFile("test.json", JSON.stringify(kvpOut) + ',\n', function(err) {
          if (err) {
            return console.log(err);
          }
        });
        addressArray.shift();
        runNext(addressArray);
      })
      .run();
  }
}

runNext(addresses)


fs.createReadStream("./testparcels.csv")
    .pipe(csv())
    .on("data", function(data, cb){

        var address = `${data[19]} ${data[17]}`;
        var lat = `${data[1]}`;
        var lng = `${data[0]}`;
        var idIthink = `${data[2]}`
        console.log('working on ', address)
        runNext([address], function(response){
          cb(response);
        });
    })
    .on("end", function(){
        console.log("done");
    });
