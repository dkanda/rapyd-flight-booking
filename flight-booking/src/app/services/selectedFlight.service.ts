import { Inject, Injectable, Optional }                      from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams,
         HttpResponse, HttpEvent }                           from '@angular/common/http';

import { Flight } from '../model/flight';

@Injectable()
export class SelectedFlightService {

    // public configuration = new Configuration();
    public flight: Flight;
    constructor(){}

    setSelectedFlight(selectedFlight){
        this.flight = selectedFlight;
    }

}
