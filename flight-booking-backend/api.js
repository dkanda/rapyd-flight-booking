const https = require('https');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const accessKey = process.env.RAYPD_ACCESS_KEY; 
const secretKey = process.env.RAYPD_SECRET_KEY;
const log = true;

async function makeRequest(method, urlPath, body = null) {

    try {
        httpMethod = method;
        httpBaseURL = "sandboxapi.rapyd.net";
        httpURLPath = urlPath;
        salt = CryptoJS.lib.WordArray.random(12); 
        idempotency = new Date().getTime().toString();
        timestamp = (Math.floor(new Date().getTime() / 1000) - 10).toString();
        //signature = sign(httpMethod, httpURLPath, salt, timestamp, body)

        let to_sign = "";
        if(body != null){
            to_sign = httpMethod.toLowerCase() + httpURLPath + salt + timestamp + accessKey + secretKey + JSON.stringify(body);
        }
        else{
            to_sign = httpMethod.toLowerCase() + httpURLPath + salt + timestamp + accessKey + secretKey;
        }
        
        let signature = CryptoJS.enc.Hex.stringify(CryptoJS.HmacSHA256(to_sign, secretKey));

        signature = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(signature));
        console.log(body)

        const options = {
            hostname: httpBaseURL,
            port: 443,
            path: httpURLPath,
            method: httpMethod,
            headers: {
                'Content-Type': 'application/json',
                salt: salt,
                timestamp: timestamp,
                signature: signature,
                access_key: accessKey,
                idempotency: idempotency
            }
        }

        return await httpRequest(options, body, log);
    }
    catch (error) {
        console.error("Error generating request options");
        console.error(error)
        throw error;
    }
}

function sign(method, urlPath, salt, timestamp, body) {

    try {
        let bodyString = "";
        if (body) {
            bodyString = JSON.stringify(body);
            bodyString = bodyString == "{}" ? "" : bodyString;
        }

        let toSign = method.toLowerCase() + urlPath + salt + timestamp + accessKey + secretKey + bodyString;
        log && console.log(`toSign: ${toSign}`);

        let hash = crypto.createHmac('sha256', secretKey);
        hash.update(toSign);
        const signature = Buffer.from(hash.digest("hex")).toString("base64")
        log && console.log(`signature: ${signature}`);

        return signature;
    }
    catch (error) {
        console.error("Error generating signature");
        throw error;
    }
}

function generateRandomString(size) {
    try {
        return crypto.randomBytes(size).toString('hex');
    }
    catch (error) {
        console.error("Error generating salt");
        throw error;
    }
}

async function httpRequest(options, body) {

    return new Promise((resolve, reject) => {

        try {
            
            let bodyString = "";
            if (body) {
                bodyString = JSON.stringify(body);
                bodyString = bodyString == "{}" ? "" : bodyString;
            }

            log && console.log(`httpRequest options: ${JSON.stringify(options)}`);
            const req = https.request(options, (res) => {
                let response = {
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: ''
                };

                res.on('data', (data) => {
                    response.body += data;
                });

                res.on('end', () => {
                    console.log(response.body)
                    response.body = response.body ? JSON.parse(response.body) : {}
                    log && console.log(`httpRequest response: ${JSON.stringify(response)}`);

                    if (response.statusCode !== 200) {
                        return reject(response);
                    }

                    return resolve(response);
                });
            })
            
            req.on('error', (error) => {
                return reject(error);
            })
            
            req.write(bodyString)
            req.end();
        }
        catch(err) {
            return reject(err);
        }
    })

}

exports.makeRequest = makeRequest;