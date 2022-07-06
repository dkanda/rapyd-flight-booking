import { Inject, Injectable, Optional } from '@angular/core';
import {
    HttpClient, HttpHeaders, HttpParams,
    HttpResponse, HttpEvent
} from '@angular/common/http';

import { Flight } from '../model/flight';
import { Currency } from '../model/currency';

@Injectable()
export class CurrencyService {

    public currencies = [{ "id": 140, "name": "Australia", "iso_alpha2": "AU", "iso_alpha3": "AUS", "currency_code": "AUD", "currency_name": "Australlian Dollar", "currency_sign": "$", "phone_code": "61" },
    { "id": 37, "name": "Germany", "iso_alpha2": "DE", "iso_alpha3": "DEU", "currency_code": "EUR", "currency_name": "Euro", "currency_sign": "€", "phone_code": "49" },
    { "id": 190, "name": "Denmark", "iso_alpha2": "DK", "iso_alpha3": "DNK", "currency_code": "DKK", "currency_name": "Danish krone", "currency_sign": "kr", "phone_code": "45" },
    { "id": 104, "name": "United Kingdom", "iso_alpha2": "GB", "iso_alpha3": "GBR", "currency_code": "GBP", "currency_name": "Pound Sterling", "currency_sign": "£", "phone_code": "44" },
    { "id": 233, "name": "Indonesia", "iso_alpha2": "ID", "iso_alpha3": "IDN", "currency_code": "IDR", "currency_name": "Indonesian rupiah", "currency_sign": "Rp", "phone_code": "62" },
    { "id": 116, "name": "Mexico", "iso_alpha2": "MX", "iso_alpha3": "MEX", "currency_code": "MXN", "currency_name": "Mexican Peso", "currency_sign": "$", "phone_code": "52" },
    { "id": 287, "name": "New Zealand", "iso_alpha2": "NZ", "iso_alpha3": "NZL", "currency_code": "NZD", "currency_name": "New Zealand dollar", "currency_sign": "$", "phone_code": "64" },
    { "id": 330, "name": "Singapore", "iso_alpha2": "SG", "iso_alpha3": "SGP", "currency_code": "SGD", "currency_name": "Singapore dollar", "currency_sign": "$", "phone_code": "65" },
    { "id": 332, "name": "Slovakia", "iso_alpha2": "SK", "iso_alpha3": "SVK", "currency_code": "EUR", "currency_name": "Euro", "currency_sign": "€", "phone_code": "421" },
    { "id": 106, "name": "United States of America", "iso_alpha2": "US", "iso_alpha3": "USA", "currency_code": "USD", "currency_name": "US Dollar", "currency_sign": "$", "phone_code": "1" }]

    public selectedCurrency: Object;
    public selectedCurrencyCode: string;
    public selectedCountryCode: string;
    public id: number;
    constructor() { }

    setCurrencyFromCurrencyID(id) {
    
        this.currencies.forEach(element => {
            if (element.id == id){
                this.id = element.id
                this.selectedCurrency = element;
                this.selectedCountryCode = element.iso_alpha2;
                this.selectedCurrencyCode = element.currency_code;
                return element;
            }
        });
        return {};
    }


}