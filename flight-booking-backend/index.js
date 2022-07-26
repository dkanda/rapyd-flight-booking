const express = require('express')
const api = require('./api');
const db_funcs = require('./db');
const face_image = require('./face_image');
const app = express();
var cors = require('cors')

const bodyParser = require('body-parser');
const db = require('better-sqlite3')('sqlite.db', { });

const port = 3001;
base_currency = "USD";
base_country = "US"
const my_base_url = "http://raypd-flight-booking.vercelapp.com"
const enforce_final_price = true;

const { get } = require('request');
const { query } = require('express');

// Seed the database with flight data.
db_funcs.seedDb();

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cors())

// Creates a payout based on the merchant id (flight confirmation code)
// @param req.query.merchant_reference_id Merchant id
// @param 
// @pre merchant_reference_id exists in rapyd 
// @post create
app.post('/createRefund', (req, res) => {
    result = db.prepare(`select * from purchases where merchant_id='${req.query.merchant_reference_id}' and amt_paid > 0 and is_refunded = 0`).all()
    if (result.length < 0) {
        res.send("Err: merchant id does not exist");
    }
    fxResult = db.prepare(`select rate from FX where sell='${result[0]['preferred_currency']}' and date = '${getDate()}'`).all()
    let fxRate = parseFloat(fxResult[0]['rate']);

    let body = {
        "payout_method_type": (result[0]['preferred_country_iso2']).toLowerCase() + "_general_bank",
        "ewallet": result[0]['wallet_id'],
        "payout_amount": result[0].amt_paid / fxRate,
        "sender_currency": result[0].preferred_currency,
        "sender_country": base_country,
        "beneficiary_country": result[0].preferred_country_iso2,
        "payout_currency": result[0].preferred_currency,
        "sender_entity_type": "company",
        "beneficiary_entity_type": "individual",
        "beneficiary": req.query,
        "sender": {
            "name": "Space Tours",
            "country": base_country,
            "city": "new york",
            "address": "1 main st",
            "currency": result[0].preferred_currency,
            "entity_type": "company",
            "identification_type": "12345",
            "identification_value": "0123456789",
        },
        "description": "Refund",
        "merchant_reference_id": req.query.merchant_reference_id,

    }

    api.makeRequest('POST', '/v1/payouts', body).then(function (response) {
        if (response && response.statusCode == 200) {
            api.makeRequest('POST', `/v1/payouts/complete/${response.body.data.id}/${response.body.data.sender_amount}`).then(function (response1) {
                if (response1 && response1.statusCode == 200) {
                    //Store this value in the db
                    db.exec(`UPDATE purchases SET is_refunded = 1 where merchant_id = '${req.query.merchant_reference_id}';`, (err) => console.log(err));
                    res.send(response1.body);

                    return;
                } else {
                    res.send(response1.body);
                }
            });
        } else {
            res.send(response1.body);
        }

    }).catch(function (e) {
        console.error(e.message);
        res.send("an error occurred");
    })
});

// Gets the required fields to process a refund 
// @param req.query.country 2 letter country string 
// @param req.query.currency 3 letter currency string 
// @pre Country and currency both exist in rapyd
// @post fields and regex returned from Rapyd.
app.get('/getRequiredFields', (req, res) => {
    let country_lower = (req.query.country).toLowerCase();
    let payment_name = `${country_lower}_general_bank`;
    api.makeRequest('GET', `/v1/payouts/${payment_name}/details?beneficiary_country=${country_lower}&beneficiary_entity_type=individual&payout_amount=10000&payout_currency=${req.query.currency}&sender_country=us&sender_currency=${req.query.currency}&sender_entity_type=company`).then(function (response) {
        if (response && response.statusCode == 200) {
            res.send(response.body);
        } else {
            res.send(response.body);
        }

    }).catch(function (e) {
        console.error(e.message);
        res.send("an error occurred");
    })

})

// Create VAN for user to deposit funds into
// @param req.query.currency Preferred customer currency
// @param req.query.country Preferred customer country
// @param req.query.flight Desired flight number to book
// @pre Flight number exists in flights database, currency and country are
//  valid by the Rapyd api.
// @post New ewallet and VAN are created in Rapyd. IBAN or account number to 
// send funds along with confirmation number is returned. E.g:
// {
//     "account_number": "DK4289000092780662",
//     "routing": "",
//     "amount_due": 567046.3599078546,
//     "conf": "S2EEEL"
// }
app.post('/createCheckoutUrl', (req, res) => {
    let merchant_reference_id = "";
    let cancel_checkout_url = "";
    let complete_checkout_url = "";
    let amountDue = 0.0;

    let todayString = getDate()

    let flightDetails = {}

    flights = db.prepare(`select * from flights`).all()

    for (i = 0; i < flights.length; i++) {
        if (flights[i].id == req.query.flight) {
            flightDetails = flights[i];
            break;
        }
    }

    // Get the fx rate for this currency
    fxResult = db.prepare(`select rate from FX where sell='${req.query.currency}' and date = '${todayString}'`).all()
    let fxRate = parseFloat(fxResult[0]['rate']);

    if (req.query.finalPayment == 1) {
        merchant_reference_id = req.query.conf;
        // Amount due might not be just half since the exchange has likely changed. 
        if (enforce_final_price) {

            // Get what has already been paid 
            result = db.prepare(`select amt_paid from purchases where merchant_id='${merchant_reference_id}'`).all()
            let amt_paid_in_local_curr = parseFloat(result[0]['amt_paid']);
            // Price of the flight plus fees minus amt already paid in base currency.
            amountDue = Math.ceil((1000 + (flightDetails.price)) - (amt_paid_in_local_curr * fxRate));
        }
    } else {
        merchant_reference_id = makeid(6);
        // Amount due will always be half the total cost for the deposit.
        amountDue = Math.floor((1000 + (flightDetails.price)) / 2) / fxRate;
    }
    //Create new ewallet etc
    let body =
    {
        "first_name": "Space Tours",
        "last_name": "",
        "business_details": {
            "entity_type": "association",
            "name": "Space Tours",
            "registration_number": makeid(8),
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
        "ewallet_reference_id": makeid(8),
        "metadata": {
            "merchant_defined": true
        },
        "type": "company"
    }

    api.makeRequest('POST', '/v1/user', body).then(function (response) {
        if (response && response.statusCode == 200) {
            internalBody = {
                "country": "US",
                "document_type": "PA",
                "ewallet": response.body.data.id,
                "face_image": face_image.faceImage,
                "face_image_mime_type": "image/jpeg",
                "front_side_image": face_image.faceImage,
                "front_side_image_mime_type": "image/jpeg",
                "reference_id":  makeid(8)
            }
            api.makeRequest('POST', '/v1/identities', internalBody).then(function (internalResponse) {
                if (internalResponse && internalResponse.statusCode == 200) {
                    let createVANBody =
                    {
                        "currency": req.query.currency,
                        "country": req.query.country,
                        "ewallet": response.body.data.id,
                        "merchant_reference_id": merchant_reference_id,
                        "metadata": {
                            "merchant_defined": true
                        }
                    }
                    console.log(createVANBody)
                    api.makeRequest('POST', '/v1/issuing/bankaccounts', createVANBody).then(function (VANResponse) {
                        if (VANResponse && VANResponse.statusCode == 200) {
                            let account_number = "";
                            let routing = VANResponse.body.data.bank_account.aba_routing_number === undefined ? "" : VANResponse.body.data.bank_account.aba_routing_number;
                            // Some accounts use IBAN, others won't determine that here.
                            if ("account_number" in VANResponse.body.data.bank_account) {
                                account_number = VANResponse.body.data.bank_account.account_number;
                            }
                            else if ("iban" in VANResponse.body.data.bank_account) {
                                account_number = VANResponse.body.data.bank_account.iban;
                            }
                
                            if (req.query.finalPayment == 1) {
                                db.exec(`UPDATE purchases SET final_checkout_id = '${VANResponse.body.data.id}' where merchant_id = '${merchant_reference_id}';`, (err) => console.log(err));
                            } else if (routing != "") {
                                db.exec(`INSERT into purchases (flightNo, merchant_id, preferred_currency, preferred_country_iso2, issuing_id, account_number, wallet_id, routing) VALUES (${req.query.flight},'${merchant_reference_id}', '${req.query.currency}','${req.query.country}', '${VANResponse.body.data.id}', '${account_number}', '${response.body.data.id}', ${routing})`, (err) => console.log(err));
                            } else {
                                db.exec(`INSERT into purchases (flightNo, merchant_id, preferred_currency, preferred_country_iso2, issuing_id, account_number, wallet_id) VALUES (${req.query.flight},'${merchant_reference_id}', '${req.query.currency}','${req.query.country}', '${VANResponse.body.data.id}', '${account_number}', '${response.body.data.id}')`, (err) => console.log(err));
                            }
                
                            res.send({
                                "account_number": account_number,
                                "routing": routing,
                                "amount_due": amountDue,
                                "conf": merchant_reference_id
                            });
                        } else {
                            res.send(VANResponse.body);
                        }
                
                    }).catch(function (e) {
                        console.error(e.message);
                        res.send("an error occurred");
                    })
                } else {
                    res.send(response.body.data.id);
                }
        
            }).catch(function (e) {
                console.error(e.message);
                res.send("an error occurred");
            })
        } else {
              res.send(response.body);
        }

    }).catch(function (e) {
        console.error(e.message);
          res.send("an error occurred");
    })

    //end this terrible process


    // api.makeRequest('POST', '/v1/issuing/bankaccounts', body).then(function (response) {
    //     if (response && response.statusCode == 200) {

    //         let account_number = "";
    //         let routing = response.body.data.bank_account.aba_routing_number === undefined ? "" : response.body.data.bank_account.aba_routing_number;
    //         // Some accounts use IBAN, others won't determine that here.
    //         if ("account_number" in response.body.data.bank_account) {
    //             account_number = response.body.data.bank_account.account_number;
    //         }
    //         else if ("iban" in response.body.data.bank_account) {
    //             account_number = response.body.data.bank_account.iban;
    //         }

    //         if (req.query.finalPayment == 1) {
    //             db.exec(`UPDATE purchases SET final_checkout_id = '${response.body.data.id}' where merchant_id = '${merchant_reference_id}';`, (err) => console.log(err));
    //         } else if (routing != "") {
    //             db.exec(`INSERT into purchases (flightNo, merchant_id, preferred_currency, preferred_country_iso2, issuing_id, account_number, routing) VALUES (${req.query.flight},'${merchant_reference_id}', '${req.query.currency}','${req.query.country}', '${response.body.data.id}', '${account_number}', ${routing})`, (err) => console.log(err));
    //         } else {
    //             db.exec(`INSERT into purchases (flightNo, merchant_id, preferred_currency, preferred_country_iso2, issuing_id, account_number) VALUES (${req.query.flight},'${merchant_reference_id}', '${req.query.currency}','${req.query.country}', '${response.body.data.id}', '${account_number}')`, (err) => console.log(err));
    //         }

    //         res.send({
    //             "account_number": account_number,
    //             "routing": routing,
    //             "amount_due": amountDue,
    //             "conf": merchant_reference_id
    //         });
    //     } else {
    //         res.send(response.body);
    //     }

    // }).catch(function (e) {
    //     console.error(e.message);
    //     res.send("an error occurred");
    // })
})

// Gets details about the flight reservation
// @param req.query.confirmation Flight confirmation numumber or 
// merchant_referance_id
// @pre conf number exists in the purchases table in the database
// @post information about the reservation is returned 
// Status code will return "ERROR" when the deposit amount is not met. 
// Status code will return "SUCCESS" when the deposit amount is met. 
// {
//     "status": "ERROR",
//     "price": 150000,
//     "details": {
//         "id": "issuing_dc18b21d44aa0ecf91bff882af53804f",
//         "merchant_reference_id": "S2EEEL",
//         "ewallet": "ewallet_6e896085be68fd1179d8faf0dfc36608",
//         "bank_account": {
//             "beneficiary_name": "CashDash UK Limited",
//             "address": "Northwest House, 119 Marylebone Road NW1 5PU",
//             "country_iso": "DK",
//             "iban": "DK4289000092780662",
//             "bic": "SXPYDKKK"
//         },
//         "metadata": {
//             "merchant_defined": true
//         },
//         "status": "ACT",
//         "description": "Issue test bank account",
//         "funding_instructions": null,
//         "currency": "DKK",
//         "transactions": []
//     },
//     "issuing_id": "issuing_dc18b21d44aa0ecf91bff882af53804f",
//     "purchase_info": {
//         "id": 3,
//         "flightNo": 1,
//         "merchant_id": "S2EEEL",
//         "amt_paid": 0,
//         "issuing_id": "issuing_dc18b21d44aa0ecf91bff882af53804f",
//         "account_number": "DK4289000092780662",
//         "routing": null,
//         "final_checkout_id": null,
//         "is_refunded": 0,
//         "preferred_currency": "DKK",
//         "preferred_country_iso2": "DK",
//         "wallet_id": "ewallet_6e896085be68fd1179d8faf0dfc36608"
//     }
// }
app.get('/getCheckout', (req, res) => {
    let result = db.prepare(`SELECT * from purchases where merchant_id = '${req.query.confirmation}';`).all();
    let issuing_id = result[0]['issuing_id']

    if (result[0]['is_refunded'] == 1) {
        res.send({ "status": "SUCCESS", "refunded": true, "price": '', "details": '', 'purchase_info': '' });
        return;
    }

    api.makeRequest('GET', `/v1/issuing/bankaccounts/${issuing_id}`).then(function (response) {
        if (response && response.statusCode == 200) {
            let totalAmtPaid = 0.0;
            fxResult = db.prepare(`select rate from FX where sell='${result[0]['preferred_currency']}' and date = '${getDate()}'`).all()
            let fxRate = parseFloat(fxResult[0]['rate']);
            for (let txn of response.body.data.transactions) {
                if (txn['currency'] == base_currency) {
                    totalAmtPaid += txn["amount"];
                }
                else {
                    totalAmtPaid += (txn["amount"] * fxRate);
                }
            }

            let flightDetails = db.prepare(`SELECT price from flights where id=${result[0]['flightNo']};`).all();
            let price = flightDetails[0]['price']

            if (totalAmtPaid > 0.0) {
                // Only update the price if it's less that the total price paid.
                console.log(result[0]['amt_paid'])
                console.log((1000 + (price)) / 2)
                db.exec(`UPDATE purchases SET amt_paid = ${totalAmtPaid} WHERE id = ${result[0]['id']};`, (err) => console.log(err));
                result[0]['amt_paid'] = totalAmtPaid;
                if (totalAmtPaid + 1 < price) {
                    // If the amount was less than the deposit
                    if (totalAmtPaid + 1 < (1000 + (price)) / 2) {
                        res.send({ "status": "ERROR", "price": price, "details": response.body.data, "issuing_id": issuing_id, "purchase_info": result[0] });
                        return
                    }
                }

                res.send({ "status": "SUCCESS", "details": response.body.data, "price": price, "purchase_info": result[0] });
            } else {
                res.send({ "status": "ERROR", "price": price, "details": response.body.data, "issuing_id": issuing_id, "purchase_info": result[0] });
            }
        } else {
            res.send(response.body);
        }
    }).catch(function (e) {
        console.error(e.message);
        res.send("an error occurred");
    })
})

app.get('/getFinalCheckout', (req, res) => {
    let result = db.prepare(`SELECT * from purchases where merchant_id = '${req.query.confirmation}';`).all();
    let checkout_id = result[0]['final_checkout_id']
    if (checkout_id === undefined) {
        res.send({ "status": "SUCCESS", "details": response.body.data.payment, "price": price, "purchase_info": result[0] });
    }

    api.makeRequest('GET', `/v1/checkout/${checkout_id}`).then(function (response) {
        if (response && response.statusCode == 200) {
            //Store this value in the db
            if (response.body.data.payment.paid == true) {
                let flightDetails = db.prepare(`SELECT price from flights where id=${result[0]['flightNo']};`).all();
                let price = flightDetails[0]['price']

                // If the amount paid is less than the price of the flight then update the amt_paid.
                if (result[0]['amt_paid'] < flightDetails[0]['price']) {
                    let total_amt_paid = parseFloat(result[0]['amt_paid']) + response.body.data.payment.amount
                    db.exec(`UPDATE purchases SET amt_paid = ${total_amt_paid} WHERE id = ${result[0]['id']};`, (err) => console.log(err));
                }
                res.send({ "status": "SUCCESS", "details": response.body.data.payment, "price": price, "purchase_info": result[0] });
            } else {
                res.send({ "status": "ERROR", "final_checkout_id": checkout_id });
            }
        } else {
            res.send(response.body);
        }
    }).catch(function (e) {
        console.error(e.message);
        res.send("an error occurred");
    })
})

// Gets flights given a destination TODO: filter on date
// @param req.query.destination Destination string e.g. Mars
// @pre Database contains same flight data
// @post If a destination in the database matches the destination parameter
// return info about the flight e.g.
// [
//     {
//         "id": 1,
//         "destination": "Andromeda",
//         "flightNo": 100,
//         "price": 150000,
//         "departure": "Sat Sep 03 2022 20:10:15 GMT-0700 (Pacific Daylight Time)",
//         "arrival": "Sun Sep 04 2022 20:10:15 GMT-0700 (Pacific Daylight Time)",
//         "return": "Mon Sep 05 2022 20:10:15 GMT-0700 (Pacific Daylight Time)",
//         "class": "yes"
//     },
//     {
//         "id": 2,
//         "destination": "Andromeda",
//         "flightNo": 100,
//         "price": 150000,
//         "departure": "Sun Sep 04 2022 20:10:15 GMT-0700 (Pacific Daylight Time)",
//         "arrival": "Mon Sep 05 2022 20:10:15 GMT-0700 (Pacific Daylight Time)",
//         "return": "Tue Sep 06 2022 20:10:15 GMT-0700 (Pacific Daylight Time)",
//         "class": "yes"
//     }
// ]
app.get('/flights', (req, res) => {
    if (req.query.id !== undefined) {
        let result = db.prepare(`SELECT * from flights where id = ${req.query.id};`).all();
        res.json(result[0])
    } else if (req.query.destination !== undefined) {
        let result = db.prepare(`SELECT * from flights where destination = '${req.query.destination}';`).all();
        res.json(result)
    } else {
        flights = db.prepare(`select * from flights`).all()
        res.json(flights)
    }
})

// Gets an fx exchange rate
// @param req.query.buy_currency buy currency 
// @param req.query.sell_currency sell currency
// @pre buy and sell currencies are defined
// @post returns exchange rate data in the form:
// {
//     "sell_currency": "DKK",
//     "buy_currency": "USD",
//     "fixed_side": null,
//     "action_type": "payment",
//     "rate": 0.13314608,
//     "date": "2022-07-23",
//     "sell_amount": null,
//     "buy_amount": null
// }
app.get('/getExchange', (req, res) => {

    let buy_currency = req.query.buy_currency;
    let sell_currency = req.query.sell_currency;
    let todayString = getDate();
    result = db.prepare(`SELECT rate from FX WHERE buy = '${buy_currency}' AND sell = '${sell_currency}' AND date = '${todayString}'`).all();
    console.log(result)
    if (result !== undefined && result.length > 0) {
        res.send({ "sell_currency": sell_currency, "buy_currency": buy_currency, "fixed_side": null, "action_type": "payment", "rate": result[0]['rate'], "date": todayString, "sell_amount": null, "buy_amount": null })
        return;
    }

    api.makeRequest('GET', `/v1/rates/daily?action_type=payment&buy_currency=${buy_currency}&sell_currency=${sell_currency}`).then(function (response) {
        if (response && response.statusCode == 200) {
            //Store this value in the db
            db.exec(`INSERT OR REPLACE INTO FX (buy, sell, rate, date) VALUES ('${buy_currency}','${sell_currency}',${response.body.data.rate},'${response.body.data.date}')`, (err) => console.log(err));
            res.send(response.body.data);
        } else {
            res.send(response.body);
        }

    }).catch(function (e) {
        console.error(e.message);
        res.send("an error occurred");
    })
})

// Simulates a bank transfer in the sandbox
// @param req.query.issuing Rapyd issuing ID to send funds to.
// @param req.query.amount Integer amount in local currency to send.
// @param req.query.currency Three letter currency code e.g. DKK 
// @pre Issuing id exists, amount is an integer and currency is a valid 
// Rapyd-recognized three letter identifier.
// @post Transaction details are returned
// {"id":"issuing_dc18b21d44aa0ecf91bff882af53804f",
//  "merchant_reference_id":"S2EEEL",
//  "ewallet":"ewallet_6e896085be68fd1179d8faf0dfc36608",
//  "bank_account":{"beneficiary_name":"CashDash UK Limited",
//  "address":"Northwest House, 119 Marylebone Road NW1 5PU",
//  "country_iso":"DK",
//  "iban":"DK4289000092780662",
//  "bic":"SXPYDKKK"},"metadata":{"merchant_defined":true},"status":"ACT",
//  "description":"Issue test bank account",
//  "funding_instructions":null,"currency":"DKK",
//  "transactions":[{"id":"isutran_3820cdce47351df84f53db3f1e465f11",
//  "amount":567046,"currency":"DKK",
//  "created_at":1658613360}]}
app.post('/simulateBankTransfer', (req, res) => {
    let body = {
        "issued_bank_account": req.query.issuing,
        "amount": req.query.amount,
        "currency": req.query.currency
    }
    api.makeRequest('POST', `/v1/issuing/bankaccounts/bankaccounttransfertobankaccount`, body).then(function (response) {
        if (response && response.statusCode == 200) {
            //Store this value in the db
            res.send(response.body.data);
        } else {
            res.send(response.body);
        }

    }).catch(function (e) {
        console.error(e.message);
        res.send("an error occurred");
    })
});

app.listen(process.env.PORT || port, () => {
    console.log(`Example app listening at ${my_base_url}`)
})

// Returns today's date in a SQL-friendly format
function getDate() {
    let today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
}

// Returns a string of length 'length' containing uppercase letters
// and numbers
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}
