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

import { RapydService } from 'src/app/services/rapyd.service';

declare const QRCode:any;


@Component({
  selector: 'app-checkin',
  templateUrl: './checkin.component.html',
  styleUrls: ['./checkin.component.css']
})
export class CheckinComponent implements OnInit {


  source: string;
  flightId: number;
  city: string;
  flightClass: string;
  departDate: string;
  returnDate: string;
  exchangeRate: number;
  conf: string;
  confInput: string;
  paymentInfo: object;
  flights: Array<Flight>;
  refundResponse = "";
  refunded = false;
  isError = false;
  isPaid = false;

  dataArr: object;

  constructor(private route: ActivatedRoute, private router: Router, private flightService: FlightService, protected selectedFlight: SelectedFlightService, protected currencyService: CurrencyService, protected rapydService: RapydService) { }

  requestRefund(payment_id, merchant_reference_id) {
    this.rapydService.refundPayment(payment_id, merchant_reference_id).subscribe(success => {
      if(success['status']['status'] == 'SUCCESS'){
        this.refundResponse = "Refund was successful"
      }
      else{
        console.log(success)
      }
     
    })
    
  }

  processData(){
    this.router.navigate(['checkin'], {
      queryParams:{
        'conf': this.confInput
      }
    });
  }

  lookupReservation(){
    
  }

  check() {

  }

  ngOnInit() {
    this.route.queryParams.subscribe(
      params => {
        if('conf' in params){
          this.conf = params['conf'];
          this.getData()
        }        
      }
    );
  }

  getData(){
    this.rapydService.getCheckout(this.conf).subscribe(success => {
      if (success['status'] == 'ERROR'){
        this.isError = true;
        this.dataArr = success;
      } else {
        this.isError = false;
        this.dataArr = success['details']
        this.refunded = this.dataArr['refunded']
        this.dataArr['purchase_info'] = success['purchase_info']
        this.dataArr['price'] = success['price']
        this.currencyService.selectedCurrencyCode = success['purchase_info']['preferred_currency'];
        this.currencyService.selectedCountryCode = success['purchase_info']['preferred_country_iso2'];
        this.flightService.getFlights(success['purchase_info']['flightNo']).subscribe(success => {
          this.flights = success;
        });
        if(success['purchase_info']['amt_paid'] >=  (this.dataArr['price'] - 1)){
          this.isPaid = true;
        }

      }
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
    })
  }

  finishPayment(){
    //this.loading = true;
    this.rapydService.createCheckoutPage({
      currency: this.currencyService.selectedCurrencyCode, 
      country: this.currencyService.selectedCountryCode, 
      flight: this.flights['id'],
      finalPayment: 1,
      conf:this.conf
    }).subscribe(success => {
      console.log(success);
      document.location.href = success['url'];
    });
  }

}
