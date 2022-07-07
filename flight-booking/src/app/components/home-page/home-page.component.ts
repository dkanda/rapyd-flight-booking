import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  HttpClient, HttpHeaders, HttpParams,
  HttpResponse, HttpEvent
} from '@angular/common/http';

import { FlightService } from '../../services/flight.service'
import { Flight } from '../../model/flight';
import {DailyRate} from '../../model/dailyRate';
import { SelectedFlightService } from 'src/app/services/selectedFlight.service';
import { CurrencyService } from 'src/app/services/currency.service';

import { catchError, flatMap, map } from 'rxjs/operators';
import { RapydService } from 'src/app/services/rapyd.service';


@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {


  source: string;
  destination: string;
  city: string;
  flightClass: string;
  departDate: string;
  returnDate: string;
  exchangeRate: number;

  dataArr: Array<Flight>;

  constructor(private route: ActivatedRoute, private router: Router, private flightService: FlightService, protected selectedFlight: SelectedFlightService, protected currencyService: CurrencyService, protected rapydService: RapydService) { }

  proceedToPurchase(data) {
    this.selectedFlight.flight = data;
    this.router.navigate(['purchase'], { 
      queryParams: {
        'id': data.id,
        'curId': this.currencyService.id
      }
    });
    console.log('heyyyy');
  }


  ngOnInit() {
    this.route.queryParams.subscribe(
      params => {
        this.destination = params['destination'];
        this.departDate = params['departDate'];
        this.currencyService.setCurrencyFromCurrencyID(params['curId'])
        this.flightService.getFlightsByDestination(this.destination).subscribe(success => {
          this.dataArr = success;
        });
      }
    );

    

    if (this.rapydService.storedExchange[this.currencyService.selectedCurrencyCode] === undefined){
      this.rapydService.getExchangeRate("USD", this.currencyService.selectedCurrencyCode).subscribe(exchangeRate => {
        console.log(exchangeRate);
        this.exchangeRate = this.rapydService.storedExchange[this.currencyService.selectedCurrencyCode] = 1/exchangeRate.rate;
        // Store the exchange rate since it only changes once/day
        sessionStorage.setItem(exchangeRate.sell_currency, (1/exchangeRate.rate).toString());
      });
    }
    else {
      this.exchangeRate = this.rapydService.storedExchange[this.currencyService.selectedCurrencyCode];
    }
  }

}
