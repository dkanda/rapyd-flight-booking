const express = require('express')
const api = require('./api');
const utilities = require('./utilities');
const app = express();
var cors = require('cors')
const port = 3001;
const bodyParser = require('body-parser');

base_currency = "USD";
base_country = "US"
base_ewallet = "ewallet_4dc8ddccbb292b391ca2eb2b8f10e019"

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
// 	merchant_id text NOT NULL,
//     amt_paid integer default 0,
//     issuing_id text NOT NULL,
//     account_number text NOT NULL, 
//     routing integer,
//     final_checkout_id text,
//     preferred_currency text default "USD",
//     preferred_country_iso2 text default "US");`
// db.exec(createPurchasesTable, (err)=> console.log(err));

// const createFxTable = `CREATE TABLE fx (
//     id integer PRIMARY KEY,
//     buy text NOT NULL,
//     sell text NOT NULL,
//     rate integer default 1,
//     date text NOT NULL);`;
//     db.exec(createFxTable, (err)=> console.log(err));

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

app.get('/getPayments', (req, res)=>{
    api.makeRequest('GET',`/v1/issuing/bankaccounts/${req.query.issuing}`).then(function(response) {
        if(response && response.statusCode == 200){
            res.send(response.body)
        }else{
            res.send(response.body);
        }

    }).catch(function(e) {
        console.error(e.message);
        res.send("an error occurred");
    })
})

app.post('/issueVirtualAccountNumber', (req, res) => {
    let body = 
        {
            "currency": req.query.currency,
            "country": req.query.country,
            "ewallet": base_ewallet,
            "merchant_reference_id": req.query.merchant_id,
            "metadata": {
                "merchant_defined": true
            }
        }
    api.makeRequest('POST','/v1/issuing/bankaccounts',body).then(function(response) {
        if(response && response.statusCode == 200){
            res.send(response.body)
        }else{
            res.send(response.body);
        }

    }).catch(function(e) {
        console.error(e.message);
        res.send("an error occurred");
    })
    
})

app.post('/createClientWallet', (req, res) => {
    let body = 
    {
        "first_name": "Space Tours",
        "last_name": "",
        "business_details": {
            "entity_type": "association",
            "name": "Space Tours",
            "registration_number": "4234567778",
            "industry_category": "company",
            "industry_sub_category": "aerospace",
            "address": {
                "name": "John Doe",
                "line_1": "1234 Main Street",
                "line_2": "Suite 1200",
                "line_3": "",
                "city": "Anytown",
                "state": "NY",
                "country": "US",
                "zip": "10101",
                "phone_number": "14155557778",
                "metadata": {
                    "merchant_defined": "address"
                }
            }
        },
        "ewallet_reference_id": "space-tours",
        "metadata": {
            "merchant_defined": true
        },
        "type": "company"
    }

    api.makeRequest('POST','/v1/user',body).then(function(response) {
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

app.post('/createPayout', (req, res) => {

    req = {body : {data: { 
        "ewallet": base_ewallet,
        "payout_amount": 10,
        "sender_currency": "USD",
        "sender_country": "US",
        "beneficiary_country": "US",
        "payout_currency": "USD",
        "sender_entity_type": "company",
        "beneficiary_entity_type": "individual",
        "id": "beneficiary_5dbcaf4492f6ac5abfd48442d7b3a819",
        "sender": [],
        "description": "Payout to card"
    }}}
    
    result = db.prepare(`select * from purchases where merchant_id='X24E6R'`).all()
    if(result.length < 0){
        res.send("Err: merchant id does not exist");
    }

    let body = {
        "ewallet": base_ewallet,
        "payout_amount": result[0].amt_paid,
        "sender_currency": base_currency,
        "sender_country": base_country,
        "beneficiary_country": result[0].preferred_country_iso2,
        "payout_currency": result[0].preferred_currency,
        "sender_entity_type": "company",
        "beneficiary_entity_type": "individual",
        "beneficiary": req.body.data.id,
        "sender": [],
        "description": "Refund"
    }
    console.log(body)

    api.makeRequest('POST', '/v1/payouts', body).then(function(response) {
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
});

app.get('/getBeneficiary', (req, res) => {
    
    api.makeRequest('GET', '/v1/merchants-portal/list/beneficiaries').then(function(response) {
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

app.post('/createRefundPage', (req, res) => {
    result = db.prepare(`select preferred_country_iso2 from purchases where merchant_id='${req.query.merchant_reference_id}'`).all()
    if(result.length < 0){
        res.send("Err: merchant id does not exist");
    }
    
    let body = {
        "category": "bank",
        "sender_entity_type": "company",
        "sender_country": base_country,
        "merchant_reference_id": req.query.merchant_reference_id,
        "beneficiary_country": result[0]['preferred_country_iso2'],
        "beneficiary_entity_type": "individual",
        "sender_currency": "USD",
        "payout_currency": "EUR",
        // "cancel_url": "http://example.com/cancel",
        // "complete_url": "http://example.com/complete",
     }

    api.makeRequest('POST', '/v1/hosted/disburse/beneficiary', body).then(function(response) {
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

app.post('/createCheckoutUrl', (req, res) => {
    let merchant_reference_id = "";
    let cancel_checkout_url = "";
    let complete_checkout_url = "";
    let amountDue = 0.0;
   
    let todayString = getDate()

    let flightDetails = {} 
    for(i=0; i<dataArr.length; i++){
        if(dataArr[i].id == req.query.flight){
            flightDetails = dataArr[i];
            break;
        }
    }
    
    // Get the fx rate for this currency
    fxResult = db.prepare(`select rate from FX where sell='${req.query.currency}' and date = '${todayString}'`).all()
    let fxRate = parseFloat(fxResult[0]['rate']);

    if(req.query.finalPayment == 1){
        merchant_reference_id = req.query.conf;
        // Amount due might not be just half since the exchange has likely changed. 
        if(enforce_final_price){

            // Get what has already been paid 
            result = db.prepare(`select amt_paid from purchases where merchant_id='${merchant_reference_id}'`).all()
            let amt_paid_in_local_curr = parseFloat(result[0]['amt_paid']);
            // Price of the flight plus fees minus amt already paid in base currency.
            amountDue = Math.ceil((1000 + (flightDetails.price)) - (amt_paid_in_local_curr * fxRate));
        }
    } else {
        merchant_reference_id = makeid(6);
        // Amount due will always be half the total cost for the deposit.
        amountDue = Math.floor((1000 + (flightDetails.price))/2) / fxRate;
    }

    let body = 
    {
        "currency": req.query.currency,
        "country": req.query.country,
        "ewallet": base_ewallet,
        "merchant_reference_id": merchant_reference_id,
        "metadata": {
            "merchant_defined": true
        }
    }

    //body = utilities.encodeBase64Object(body);
    api.makeRequest('POST','/v1/issuing/bankaccounts',body).then(function(response) {
        if(response && response.statusCode == 200){
            //Store this value in the db

            let account_number = "";
            let routing = response.body.data.bank_account.aba_routing_number === undefined ? "" : response.body.data.bank_account.aba_routing_number;
            // Some accounts use IBAN, others won't determine that here.
            if ("account_number" in response.body.data.bank_account){
                account_number = response.body.data.bank_account.account_number;
            }
            else if("iban" in response.body.data.bank_account){
                account_number = response.body.data.bank_account.iban;
            }

            if(req.query.finalPayment == 1){
                db.exec(`UPDATE purchases SET final_checkout_id = '${response.body.data.id}' where merchant_id = '${merchant_reference_id}';`, (err)=> console.log(err));    
            } else if(routing != "") {                
                db.exec(`INSERT into purchases (flightNo, merchant_id, preferred_currency, preferred_country_iso2, issuing_id, account_number, routing) VALUES (${req.query.flight},'${merchant_reference_id}', '${req.query.currency}','${req.query.country}', '${response.body.data.id}', '${account_number}', ${routing})`, (err)=> console.log(err));
            } else {
                db.exec(`INSERT into purchases (flightNo, merchant_id, preferred_currency, preferred_country_iso2, issuing_id, account_number) VALUES (${req.query.flight},'${merchant_reference_id}', '${req.query.currency}','${req.query.country}', '${response.body.data.id}', '${account_number}')`, (err)=> console.log(err));
            }

            res.send({
                "account_number": account_number,
                "routing": routing,
                "amount_due": amountDue,
                "conf": merchant_reference_id
            });
        }else{
            res.send(response.body);
        }

    }).catch(function(e) {
        console.error(e.message);
        res.send("an error occurred");
    })
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
    let issuing_id = result[0]['issuing_id']
    
    api.makeRequest('GET', `/v1/issuing/bankaccounts/${issuing_id}`).then(function(response) {
        if(response && response.statusCode == 200){
            //Store this value in the db
            let totalAmtPaid = 0.0;
            fxResult = db.prepare(`select rate from FX where sell='${result[0]['preferred_currency']}' and date = '${getDate()}'`).all()
            let fxRate = parseFloat(fxResult[0]['rate']);
            for(let txn of response.body.data.transactions){
                if (txn['currency'] == base_currency){ 
                    totalAmtPaid += txn["amount"];
                }
                else{ 
                    totalAmtPaid += (txn["amount"] * fxRate);
                }
            }

            let flightDetails = db.prepare(`SELECT price from flights where id=${result[0]['flightNo']};`).all();
            let price = flightDetails[0]['price']

            if(totalAmtPaid > 0.0){ 
                // Only update the price if it's less that the total price paid.
                console.log(result[0]['amt_paid'])
                console.log((1000 + (price))/2)
                if (result[0]['amt_paid'] < price){
                    db.exec(`UPDATE purchases SET amt_paid = ${totalAmtPaid} WHERE id = ${result[0]['id']};`, (err)=> console.log(err));
                    // If the amount was less than the deposit
                    if(result[0]['amt_paid'] < (1000 + (price))/2){
                        res.send({"status": "ERROR", "price": price, "issuing_id": issuing_id, "purchase_info": result[0]});
                        return
                    }
                }
                
                res.send({"status": "SUCCESS", "details": response.body.data, "price": price, "purchase_info": result[0]});
            } else {
                res.send({"status": "ERROR", "price": price, "issuing_id": issuing_id, "purchase_info": result[0]});
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

function getDate(){
    let today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() +1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
}

app.get('/getExchange', (req, res) => {
    
    let buy_currency = req.query.buy_currency;
    let sell_currency = req.query.sell_currency;
    let todayString = getDate();
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

app.post('/simulateBankTransfer', (req, res) => {
    let body = {
        "issued_bank_account": req.query.issuing,
        "amount": req.query.amount,
        "currency": req.query.currency
    }
    api.makeRequest('POST', `/v1/issuing/bankaccounts/bankaccounttransfertobankaccount`, body).then(function(response) {
        if(response && response.statusCode == 200){
            //Store this value in the db
            res.send(response.body.data);
        }else{
            res.send(response.body);
        }

    }).catch(function(e) {
        console.error(e.message);
        res.send("an error occurred");
    })
});

app.listen(process.env.PORT || port, () => {
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