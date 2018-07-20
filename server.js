const csv = require('fast-csv')
const fs = require('fs')
const pg = require('pg')
const puppeteer = require('puppeteer')

const env = require('./config/env.js'),
    environment = new env();

// var addresses = ['1315 Webster', '1317 Webster', '5 N Calvert', '1005 N CALVERT ST']
const { Pool } = require('pg')

const pool = new Pool({
    user: environment.user,
    host: environment.host,
    database: environment.database,
    password: environment.password,
    port: environment.port,
})

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
    process.exit(-1)
})

let operatorList;
pool.connect((err, client, done) => {
    if (err) throw err
    client.query('SELECT * FROM parcels WHERE lastupdate < NOW() - INTERVAL \'7 days\' OR lastupdate IS NULL LIMIT 200', (err, res) => {
        done()

        if (err) {
            console.log(err.stack)
        } else {
            operatorList = res.rows
            console.log('fetching first 200 rows to work on')
            loop()
        }
    })

})



async function runNext(gid, address) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('http://cityservices.baltimorecity.gov/water', { waitUntil: 'load' });
    await page.type('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_ucServiceAddress_txtServiceAddress', address)
    await page.$eval('[name="ctl00$ctl00$rootMasterContent$LocalContentPlaceHolder$btnGetInfoServiceAddress"]', el => el.click());
    try {
        await page.waitForSelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblAccountNumber', { timeout: 25000 })

        const accountNumber = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblAccountNumber').textContent) || null;
        const serviceAddress = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblServiceAddress').textContent) || null;
        const currentReadDate = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblLastReadDate').textContent) || null;
        const currentBillDate = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblBillDate').textContent) || null;
        const penaltyDate = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblPenaltyDate').textContent) || null;
        const currentBillAmount = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblLastBillAmount').textContent) || null;
        const previousBalance = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblPreviousBalance').textContent) || null;
        const currentBalance = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblCurrentBalance').textContent) || null;
        const previousReadDate = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblPreviousReadDate').textContent) || null;
        const lastPayDate = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblLastPayDate').textContent) || null;
        const lastPayAmount = await page.evaluate(() => document.querySelector('#ctl00_ctl00_rootMasterContent_LocalContentPlaceHolder_lblLastPayAmount').textContent) || null;
        updateRecord(
            gid, 
            Number(accountNumber), 
            serviceAddress.trim(), 
            String(new Date(currentReadDate).toISOString()), 
            String(new Date(currentBillDate).toISOString()), 
            String(new Date(penaltyDate).toISOString()), 
            Number(currentBillAmount.replace('$', '')), 
            Number(previousBalance.replace('$', '')), 
            Number(currentBalance.replace('$', '')), 
            String(new Date(previousReadDate).toISOString()), 
            String(new Date(lastPayDate).toISOString()), 
            Number(lastPayAmount.replace('$', '')), 
            String(new Date().toISOString())
        )

    } catch (e) {
        console.log('No Data for ', address, e)
    }

    await browser.close();
};

async function loop() {

    for (const item of operatorList) {
        // console.log('working on ', item)
        console.log(item.fulladdr, item.bldg_no, item.st_name, item.st_type)
        if(item.fulladdr !== null){
            try {
                await runNext(item.gid, item.fulladdr)    
            }
            catch(e){
                console.log('something is fucked', e)
            }
        }        
    }
}

function updateRecord(gid, accountNumber, serviceAddress, currentReadDate, currentBillDate, penaltyDate, currentBillAmount, previousBalance, currentBalance, previousReadDate, lastPayDate, lastPayAmount, updateDate) {
    pool.connect((err, client, done) => {

        const shouldAbort = (err) => {
            if (err) {
                console.error('Error in transaction', err.stack)
                client.query('ROLLBACK', (err) => {
                    if (err) {
                        console.error('Error rolling back client', err.stack)
                    }
                    // release the client back to the pool
                    done()
                })
            }
            return !!err
        }

        client.query('BEGIN', (err) => {
            if (shouldAbort(err)) return
            // client.query('INSERT INTO parcels(name) VALUES($1) RETURNING id', ['brianc'], (err, res) => {
                if (shouldAbort(err)) return

                const insertText = `UPDATE parcels SET accountnumber = ${accountNumber}, serviceaddress = '${serviceAddress}', currentreaddate = '${currentReadDate}'::date, currentbilldate = '${currentBillDate}'::date, penaltydate = '${penaltyDate}'::date, currentbillamount = ${currentBillAmount}, previousbalance = ${previousBalance}, currentbalance = ${currentBalance}, previousreaddate = '${previousReadDate}'::date, lastpaydate = '${lastPayDate}'::date, lastpayamount = ${lastPayAmount}, lastupdate = '${updateDate}'::date WHERE gid = ${gid}`
                client.query(insertText, (err, res) => {
                    if (shouldAbort(err)) return

                    client.query('COMMIT', (err) => {
                        if (err) {
                            console.error('Error committing transaction', err.stack)
                        }
                        done()
                    })
                })
            // })
        })
    })
}
