import { Inject, Injectable, Optional }                      from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams,
         HttpResponse, HttpEvent }                           from '@angular/common/http';

import { Observable }                                        from 'rxjs/Observable';

import { ApiResponse } from '../model/apiResponse';
import { Flight } from '../model/flight';



@Injectable()
export class FlightService {

    protected basePath = 'http://localhost:3001';
    public defaultHeaders = new HttpHeaders();
    // public configuration = new Configuration();

    constructor(protected httpClient: HttpClient) {}
    //     if (basePath) {
    //         this.basePath = basePath;
    //     }
    //     if (configuration) {
    //         this.configuration = configuration;
    //         this.basePath = basePath || configuration.basePath || this.basePath;
    //     }
    // }



    /**
     * Get flights
     * 
     */
    public getFlights(id?: number): Observable<Array<Flight>>
    {

        // if (petId === null || petId === undefined) {
        //     throw new Error('Required parameter petId was null or undefined when calling uploadFile.');
        // }

        // let headers = this.defaultHeaders;

        // // authentication (petstore_auth) required
        // if (this.configuration.accessToken) {
        //     const accessToken = typeof this.configuration.accessToken === 'function'
        //         ? this.configuration.accessToken()
        //         : this.configuration.accessToken;
        //     headers = headers.set('Authorization', 'Bearer ' + accessToken);
        // }

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

        if(id !== undefined){
            return this.httpClient.get<Array<Flight>>(`${this.basePath}/flights?id=${id}`);    
        }
        return this.httpClient.get<Array<Flight>>(`${this.basePath}/flights`);
    }

}
