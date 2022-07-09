const db = require('better-sqlite3')('sqlite.db', { verbose: console.log });
function seedDb(){
    const drop1 = "DROP Table IF EXISTS flights;"
    db.exec(drop1, (err)=> console.log(err));

    const drop = "DROP TABLE IF EXISTS purchases"
    db.exec(drop, (err)=> console.log(err));

    const drop2 = "DROP TABLE IF EXISTS fx"
    db.exec(drop2, (err)=> console.log(err));

    const createFlightsTable = `CREATE TABLE flights (
        id integer PRIMARY KEY,
        destination text NOT NULL,
        flightNo integer DEFAULT 0,
        price integer NOT NULL,
        departure Date NOT NULL,
        arrival Date NOT NULL,
        return Date NOT NULL,
        class text NOT NULL);`
    db.exec(createFlightsTable, (err)=> console.log(err));

    const createPurchasesTable = `CREATE TABLE purchases (
        id integer PRIMARY KEY,
        flightNo integer,
        merchant_id text NOT NULL,
        amt_paid integer default 0,
        issuing_id text NOT NULL,
        account_number text NOT NULL, 
        routing integer,
        final_checkout_id text,
        is_refunded integer default 0,
        preferred_currency text default "USD",
        preferred_country_iso2 text default "US");`
    db.exec(createPurchasesTable, (err)=> console.log(err));

    const createFxTable = `CREATE TABLE fx (
        id integer PRIMARY KEY,
        buy text NOT NULL,
        sell text NOT NULL,
        rate integer default 1,
        date text NOT NULL);`;
        db.exec(createFxTable, (err)=> console.log(err));

    let september3 = new Date(1662261015000)
    let september4 = new Date(1662347415000)
    let september5 = new Date(1662433815000)
    let september6 = new Date(1662520215000)

    db.exec(`INSERT INTO flights (id, destination, flightNo, price, departure, arrival, return, class) VALUES (1, 'Andromeda', 100, 150000, '${september3}', '${september4}', '${september5}', 'yes')`, (err)=> console.log(err));
    db.exec(`INSERT INTO flights (id, destination, flightNo, price, departure, arrival, return, class) VALUES (2, 'Andromeda', 100, 150000, '${september4}', '${september5}', '${september6}', 'yes')`, (err)=> console.log(err));
    db.exec(`INSERT INTO flights (id, destination, flightNo, price, departure, arrival, return, class) VALUES (3, 'Mars', 100, 150000, '${september3}', '${september4}', '${september5}', 'yes')`, (err)=> console.log(err));
    db.exec(`INSERT INTO flights (id, destination, flightNo, price, departure, arrival, return, class) VALUES (4, 'Mars', 100, 150000, '${september4}', '${september5}', '${september6}', 'yes')`, (err)=> console.log(err));
    db.exec(`INSERT INTO flights (id, destination, flightNo, price, departure, arrival, return, class) VALUES (5, 'ISS', 100, 150000, '${september3}', '${september4}', '${september5}', 'yes')`, (err)=> console.log(err));
    db.exec(`INSERT INTO flights (id, destination, flightNo, price, departure, arrival, return, class) VALUES (6, 'ISS', 100, 150000, '${september4}', '${september5}', '${september6}', 'yes')`, (err)=> console.log(err));
}

exports.seedDb = seedDb;