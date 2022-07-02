import { Inject, Injectable, Optional } from '@angular/core';
import {
    HttpClient, HttpHeaders, HttpParams,
    HttpResponse, HttpEvent
} from '@angular/common/http';

import { Observable } from 'rxjs/Observable';

import { ApiResponse } from '../model/apiResponse';
import { DailyRate } from '../model/dailyRate';



@Injectable()
export class RapydService {

    protected basePath = 'http://localhost:3001';
    public storedExchange = {};
    public defaultHeaders = new HttpHeaders();
    // public configuration = new Configuration();

    constructor(protected httpClient: HttpClient) { }
    //     if (basePath) {
    //         this.basePath = basePath;
    //     }
    //     if (configuration) {
    //         this.configuration = configuration;
    //         this.basePath = basePath || configuration.basePath || this.basePath;
    //     }
    // }



    /**
     * Get exchange rate
     * 
     */
    public getExchangeRate(buy_currency: string, sell_currency: string): Observable<DailyRate> {


        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];

        // to determine the Content-Type header
        // const consumes: string[] = [
        //     'multipart/form-data'
        // ];

        // const canConsumeForm = this.canConsumeForm(consumes);

        let formParams: { append(param: string, value: any): void | HttpParams; };
        let useForm = false;
        let convertFormParamsToString = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        // see https://stackoverflow.com/questions/4007969/application-x-www-form-urlencoded-or-multipart-form-data

        formParams = new FormData();


        return this.httpClient.get<DailyRate>(`${this.basePath}/getExchange?buy_currency=${buy_currency}&sell_currency=${sell_currency}`);
    }

    /**
     * Create checkout page
     * 
     */
    public createCheckoutPage(params: any): Observable<Object> {
        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];

        // to determine the Content-Type header
        // const consumes: string[] = [
        //     'multipart/form-data'
        // ];

        // const canConsumeForm = this.canConsumeForm(consumes);

        let formParams: { append(param: string, value: any): void | HttpParams; };
        let useForm = false;
        let convertFormParamsToString = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        // see https://stackoverflow.com/questions/4007969/application-x-www-form-urlencoded-or-multipart-form-data

        formParams = new FormData();

        let paramStr = new URLSearchParams(params).toString();

        return this.httpClient.post<Object>(`${this.basePath}/createCheckoutUrl?${paramStr}`, null);
    }

    /**
    * get checkout page
    * 
    */
    public getCheckout(confirmation: string): Observable<Object> {
        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];

        // to determine the Content-Type header
        // const consumes: string[] = [
        //     'multipart/form-data'
        // ];

        // const canConsumeForm = this.canConsumeForm(consumes);

        let formParams: { append(param: string, value: any): void | HttpParams; };
        let useForm = false;
        let convertFormParamsToString = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        // see https://stackoverflow.com/questions/4007969/application-x-www-form-urlencoded-or-multipart-form-data

        formParams = new FormData();

        return this.httpClient.get<Object>(`${this.basePath}/getCheckout?confirmation=${confirmation}`);
    }

     /**
    * get checkout page
    * 
    */
      public getFinalCheckout(confirmation: string): Observable<Object> {
        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];

        // to determine the Content-Type header
        // const consumes: string[] = [
        //     'multipart/form-data'
        // ];

        // const canConsumeForm = this.canConsumeForm(consumes);

        let formParams: { append(param: string, value: any): void | HttpParams; };
        let useForm = false;
        let convertFormParamsToString = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        // see https://stackoverflow.com/questions/4007969/application-x-www-form-urlencoded-or-multipart-form-data

        formParams = new FormData();

        return this.httpClient.get<Object>(`${this.basePath}/getFinalCheckout?confirmation=${confirmation}`);
    }

    /**
    * get checkout page
    * 
    */
     public refundPayment(payment_id: number, merchant_reference_id: string): Observable<Object> {
        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];

        // to determine the Content-Type header
        // const consumes: string[] = [
        //     'multipart/form-data'
        // ];

        // const canConsumeForm = this.canConsumeForm(consumes);

        let formParams: { append(param: string, value: any): void | HttpParams; };
        let useForm = false;
        let convertFormParamsToString = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        // see https://stackoverflow.com/questions/4007969/application-x-www-form-urlencoded-or-multipart-form-data

        formParams = new FormData();

        return this.httpClient.get<Object>(`${this.basePath}/refundPayment?payment_id=${payment_id}&merchant_reference_number=${merchant_reference_id}`);
    }
}
