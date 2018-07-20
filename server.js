var csv = require('fast-csv');
var fs = require('fs');

var addresses = ['1315 Webster', '1317 Webster', '5 N Calver', '1005 N CALVERT ST ']
//

const puppeteer = require('puppeteer');

async function runNext(address) {
    console.log('Starting: ', address)
    // async() => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('http://cityservices.baltimorecity.gov/water', { waitUntil: 'load' });
    await page.type('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_ucServiceAddress_txtServiceAddress', address)
    await page.$eval('[name="ctl00$ctl00$rootMasterContent$LocalContentPlaceHolder$btnGetInfoServiceAddress"]', el => el.click());
    try {
    await page.waitForSelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblAccountNumber', {timeout: 15000})

        const accountNumber = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblAccountNumber').textContent)
        const serviceAddress = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblServiceAddress').textContent)
        const currentReadDate = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblLastReadDate').textContent)
        const currentBillDate = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblBillDate').textContent)
        const penaltyDate = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblPenaltyDate').textContent)

        console.log(penaltyDate, serviceAddress, accountNumber)
}
catch(e){
  console.log('fuck, no data')
}

    // const checkIfFound = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_pnlBillDetail'))
    // if (checkIfFound === null) {
        // console.log('No bill detail found')
    // } else {





    // }



    // await page.screenshot({path: 'example.png'});
    await browser.close();
    // }
};

async function loop(array) {
    for (const item of array) {
        console.log('working on ', item)
        //     console.log('on ,', addresses[a])
        await runNext(item)
    }
}

loop(addresses)

//   if (addressArray.length > 0) {
//     console.log('working on ', `${addressArray[0]}`)
//     new Nightmare({
//         loadImages: false,
//       })
//       .goto('http://cityservices.baltimorecity.gov/water')
//       .type('input[title="Service Address"]', `${addressArray[0]}`)
//       .click('input[name="ctl00$ctl00$rootMasterContent$LocalContentPlaceHolder$btnGetInfoServiceAddress"]')
//       .wait()
//       .evaluate(function() {
//         return document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_pnlBillDetail').innerText;
//       }, function(result) {
//         var kvpOut = {};
//         kvpOut['ScrapeTime'] = new Date();
//         if (result) {
//           result.split("\n").forEach(function(x) {
//             var arr = x.split(':\t');
//             arr[1] && (kvpOut[arr[0]] = arr[1]);
//           });
//         } else {
//           kvpOut['Service Address'] = addressArray[0];
//           kvpOut['note'] = 'Parse Failed';
//         }
//         fs.appendFile("test.json", JSON.stringify(kvpOut) + ',\n', function(err) {
//           if (err) {
//             return console.log(err);
//           }
//         });
//         addressArray.shift();
//         runNext(addressArray);
//       })
//       .run();
//   }
// }

// runNext(addresses)


// fs.createReadStream("./testparcels.csv")
//     .pipe(csv())
//     .on("data", function(data, cb){

//         var address = `${data[19]} ${data[17]}`;
//         var lat = `${data[1]}`;
//         var lng = `${data[0]}`;
//         var idIthink = `${data[2]}`
//         console.log('working on ', address)
//         runNext([address], function(response){
//           cb(response);
//         });
//     })
//     .on("end", function(){
//         console.log("done");
//     });