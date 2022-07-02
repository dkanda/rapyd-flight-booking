const express = require('express')
const api = require('./api');
const utilities = require('./utilities');
const app = express();
var cors = require('cors')
const port = 3001;
const bodyParser = require('body-parser');

//base_currency = "USD";
//base_country = "US"

const {
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');
const { get } = require('request');
const { query } = require('express');

const db = require('better-sqlite3')('foobar.db', { verbose: console.log });
// const drop = "DROP Table IF EXISTS flights;"
// const drop = "DROP TABLE IF EXISTS purchases"
// db.exec(drop, (err)=> console.log(err));

// const createFlightsTable = `CREATE TABLE flights (
// 	id integer PRIMARY KEY,
//    	destination text NOT NULL,
// 	flightNo integer DEFAULT 0,
//     price integer NOT NULL,
//     departure Date NOT NULL,
//     arrival Date NOT NULL,
//     return Date NOT NULL,
//     class text NOT NULL);`
// db.exec(createFlightsTable, (err)=> console.log(err));

// const createPurchasesTable = `CREATE TABLE purchases (
// 	id integer PRIMARY KEY,
//     flightNo integer,
// 	   merchant_id text NOT NULL,
//     amt_paid integer default 0,
//     checkout_id text NOT NULL,
//     final_checkout_id text,
//     preferred_currency text default "USD",
//     preferred_country_iso2 text default "US");`
// db.exec(createPurchasesTable, (err)=> console.log(err));


// db.exec(`INSERT INTO flights (id, destination, flightNo, price, departure, arrival, return, class) VALUES (1, 'Andromeda', 100, 150000, '${Date.now()}', '${Date.now() + 1000 * 60 * 60 * 15}', '${Date.now() + 1000 * 60 * 60 * 30}', 'yes')`, (err)=> console.log(err));


let dataArr = [
    {id:'1', destination: 'Andromeda', flightNo: 100, price: 150000, departure: Date.now(), arrival: Date.now() + 1000 * 60 * 60 * 15, return: Date.now() + 1000 * 60 * 60 * 30, class: "first"},
    {id:'2', destination: 'Andromeda', flightNo: 100, price: 50000, departure: Date.now(), arrival: Date.now() + 1000 * 60 * 60 * 15 , return: Date.now() + 1000 * 60 * 60 * 30,class: "coach"},
  ]

const my_base_url = "http://davidkanda.com:4200"
const enforce_final_price = true;

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/success', (req, res) => {
    res.send('Success page')
})

app.get('/failure', (req, res) => {
    res.send('failure page')
})

app.get('/cancel', (req, res) => {
    res.send('cancel page')
})

app.get('/refundPayment', (req, res) => {
    if(req.query.payment_id && req.query.merchant_reference_number){
        let body={
            payment:req.query.payment_id
        }

        api.makeRequest('POST','/v1/refunds',body).then(function(response) {
            if(response && response.statusCode == 200){
                //Store this value in the db
                db.exec(`UPDATE purchases SET amt_paid = 0 WHERE merchant_id = '${req.query.merchant_reference_number}';`, (err)=> console.log(err));
                res.send(response.body);
            }else{
                res.send(response.body);
            }
    
        }).catch(function(e) {
            console.error(e.message);
            res.send("an error occurred");
        })
    }
})

app.post('/createCheckoutUrl', (req, res) => {
    let merchant_reference_id = "";
    let cancel_checkout_url = "";
    let complete_checkout_url = "";
    let amountDue = 0.0;
    let today = new Date();
    let todayString = `${today.getFullYear()}-${(today.getMonth() +1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`

    let flightDetails = {} 
    for(i=0; i<dataArr.length; i++){
        if(dataArr[i].id == req.query.flight){
            flightDetails = dataArr[i];
            break;
        }
    }

    if(req.query.finalPayment == 1){
        merchant_reference_id = req.query.conf;
        cancel_checkout_url = my_base_url + `/checkin?conf=${merchant_reference_id}`,
        complete_checkout_url = my_base_url + `/ticket?conf=${merchant_reference_id}`
        // Amount due might not be just half since the exchange has likely changed. 
        if(enforce_final_price){
            // Get the fx rate for this currency
            result = db.prepare(`select rate from FX where sell='${req.query.currency}' and date = '${todayString}'`).all()
            let fxRate = parseFloat(result[0]['rate']);
            // Get what has already been paid 
            result = db.prepare(`select amt_paid from purchases where merchant_id='${merchant_reference_id}'`).all()
            let amt_paid_in_local_curr = parseFloat(result[0]['amt_paid']);
            // Price of the flight plus fees minus amt already paid in base currency.
            amountDue = Math.ceil((1000 + (flightDetails.price)) - (amt_paid_in_local_curr * fxRate));
        }
    } else {
        merchant_reference_id = makeid(6);
        cancel_checkout_url = my_base_url + `/purchase?id=${req.query.flight}&currency=${req.query.currency}`,
        complete_checkout_url = my_base_url + `/purchase-success?id=${req.query.flight}&currency=${req.query.currency}&conf=${merchant_reference_id}`
        // Amound due will always be half the total cost for the deposit.
        amountDue = Math.floor((1000 + (flightDetails.price))/2);
    }



    

    let body={
        currency:"USD",
        country: req.query.country,//supported country code - for example "AT",
        amount:amountDue,//for example - 10,
        merchant_reference_id:merchant_reference_id,//unique order_id - for example - uuidv4(),
        expiration: Math.floor(Date.now()/ 1000) + (24 * 60 * 60), //24 hours to complete purchase
        merchant_alias: "Space Tours",
        merchant_main_button: "pay_now",
        requested_currency: req.query.currency,
        cancel_checkout_url,
        complete_checkout_url
    };
    //body = utilities.encodeBase64Object(body);
    api.makeRequest('POST','/v1/checkout',body).then(function(response) {
        if(response && response.statusCode == 200){
            //Store this value in the db
            if(req.query.finalPayment == 1){
                db.exec(`UPDATE purchases SET final_checkout_id = '${response.body.data.id}' where merchant_id = '${merchant_reference_id}';`, (err)=> console.log(err));    
            } else {
                db.exec(`INSERT into purchases (flightNo, merchant_id, preferred_currency, preferred_country_iso2, checkout_id) VALUES (${req.query.flight},'${merchant_reference_id}', '${req.query.currency}','${req.query.country}', '${response.body.data.id}')`, (err)=> console.log(err));
            }
            checkoutId = response.body.data.id
            res.send({url: response.body.data.redirect_url});
        }else{
            res.send(response.body);
        }

    }).catch(function(e) {
        console.error(e.message);
        res.send("an error occurred");
    })
})


app.get('/paymentDetailsByOrderId', (req, res) => {
    if(req.query["order_id"] && DB[req.query["order_id"]]){
        res.send(DB[req.query["order_id"]]);
    }else{
        res.send("didn't find order_id in db");
    }
})

app.get('/countries', (req, res) => {
    api.makeRequest('GET', '/v1/data/countries').then(function(response) {
        if(response && response.statusCode == 200){
            //Store this value in the db
            res.send(response.body);
        }else{
            res.send(response.body);
        }

    }).catch(function(e) {
        console.error(e.message);
        res.send("an error occurred");
    })
})

app.get('/getCheckout', (req, res) => {
    let result = db.prepare(`SELECT * from purchases where merchant_id = '${req.query.confirmation}';`).all();
    let checkout_id = result[0]['checkout_id']
    
    api.makeRequest('GET', `/v1/checkout/${checkout_id}`).then(function(response) {
        if(response && response.statusCode == 200){
            //Store this value in the db
            if(response.body.data.payment.paid == true){
                let flightDetails = db.prepare(`SELECT price from flights where id=${result[0]['flightNo']};`).all();
                let price = flightDetails[0]['price']
                
                // Only update the price if it's less that the total price paid.
                if (result[0]['amt_paid'] < price){
                    db.exec(`UPDATE purchases SET amt_paid = ${response.body.data.payment.amount} WHERE id = ${result[0]['id']};`, (err)=> console.log(err));
                }
                
                res.send({"status": "SUCCESS", "details": response.body.data.payment, "price": price, "purchase_info": result[0]});
            } else {
                res.send({"status": "ERROR", "checkout_id": checkout_id});
            }
        }else{
            res.send(response.body);
        }
    }).catch(function(e) {
        console.error(e.message);
        res.send("an error occurred");
    })
})

app.get('/getFinalCheckout', (req, res) => {
    let result = db.prepare(`SELECT * from purchases where merchant_id = '${req.query.confirmation}';`).all();
    let checkout_id = result[0]['final_checkout_id']
    if(checkout_id === undefined){
        res.send({"status": "SUCCESS", "details": response.body.data.payment, "price": price, "purchase_info": result[0]});
    }
    
    api.makeRequest('GET', `/v1/checkout/${checkout_id}`).then(function(response) {
        if(response && response.statusCode == 200){
            //Store this value in the db
            if(response.body.data.payment.paid == true){
                let flightDetails = db.prepare(`SELECT price from flights where id=${result[0]['flightNo']};`).all();
                let price = flightDetails[0]['price']

                // If the amount paid is less than the price of the flight then update the amt_paid.
                if(result[0]['amt_paid'] < flightDetails[0]['price']){
                    let total_amt_paid = parseFloat(result[0]['amt_paid']) + response.body.data.payment.amount
                    db.exec(`UPDATE purchases SET amt_paid = ${total_amt_paid} WHERE id = ${result[0]['id']};`, (err)=> console.log(err));
                }
                res.send({"status": "SUCCESS", "details": response.body.data.payment, "price": price, "purchase_info": result[0]});
            } else {
                res.send({"status": "ERROR", "final_checkout_id": checkout_id});
            }
        }else{
            res.send(response.body);
        }
    }).catch(function(e) {
        console.error(e.message);
        res.send("an error occurred");
    })
})

app.get('/flights', (req, res) => {
    if(req.query.id !== undefined){
        let result = db.prepare(`SELECT * from flights where id = ${req.query.id};`).all();
        res.json(result[0])
    } else {
        res.json(dataArr)
    }
})

app.get('/getExchange', (req, res) => {
    
    let buy_currency = req.query.buy_currency;
    let sell_currency = req.query.sell_currency;
    let today = new Date();
    let todayString = `${today.getFullYear()}-${(today.getMonth() +1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
    result = db.prepare(`SELECT rate from FX WHERE buy = '${buy_currency}' AND sell = '${sell_currency}' AND date = '${todayString}'`).all();
    console.log(result)
    if(result !== undefined && result.length > 0){
        res.send({"sell_currency":sell_currency,"buy_currency":buy_currency,"fixed_side":null,"action_type":"payment","rate":result[0]['rate'],"date":todayString,"sell_amount":null,"buy_amount":null})
        return;
    }
    
    api.makeRequest('GET', `/v1/rates/daily?action_type=payment&buy_currency=${buy_currency}&sell_currency=${sell_currency}`).then(function(response) {
        if(response && response.statusCode == 200){
            //Store this value in the db
            db.exec(`INSERT OR REPLACE INTO FX (buy, sell, rate, date) VALUES ('${buy_currency}','${sell_currency}',${response.body.data.rate},'${response.body.data.date}')`, (err)=> console.log(err));
            res.send(response.body.data);
        }else{
            res.send(response.body);
        }

    }).catch(function(e) {
        console.error(e.message);
        res.send("an error occurred");
    })
})

app.listen(port, () => {
    console.log(`Example app listening at ${my_base_url}`)
})

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}