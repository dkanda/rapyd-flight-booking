import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  HttpClient, HttpHeaders, HttpParams,
  HttpResponse, HttpEvent
} from '@angular/common/http';

import { FlightService } from '../../services/flight.service'
import { Flight } from '../../model/flight';
import { DailyRate } from '../../model/dailyRate';
import { SelectedFlightService } from 'src/app/services/selectedFlight.service';
import { CurrencyService } from 'src/app/services/currency.service';

import { catchError, flatMap, map } from 'rxjs/operators';
import { RapydService } from 'src/app/services/rapyd.service';
import { TouchSequence } from 'selenium-webdriver';


@Component({
  selector: 'app-purchase-success',
  templateUrl: './purchase-success.component.html',
  styleUrls: ['./purchase-success.component.css']
})
export class PurchaseSuccessComponent implements OnInit {


  source: string;
  flightId: number;
  city: string;
  flightClass: string;
  departDate: string;
  returnDate: string;
  exchangeRate: number;
  conf: string;
  paymentInfo: object;
  flights: Array<Flight>;
  refundResponse = "";
  refunded = false;
  isError = false;
  requiredFields: Array<object>;
  refundFields = {};
  intervalId: any;

  dataArr: object;

  constructor(private route: ActivatedRoute, private router: Router, private flightService: FlightService, protected selectedFlight: SelectedFlightService, protected currencyService: CurrencyService, protected rapydService: RapydService) { }

  requestRefund(payment_id, merchant_reference_id) {
    this.rapydService.getRequiredFields(this.dataArr['purchase_info']['preferred_country_iso2'], 
      this.dataArr['purchase_info']['preferred_currency']).subscribe(success => {
        this.requiredFields = success['data']['beneficiary_required_fields'];
        for(let field of this.requiredFields){
           
          this.refundFields[field['name']] =  "";
          if(field['name'] == "payment_type"){
            this.refundFields[field['name']] = field['regex']
          }         
        }    
    })
  }

  processRefund(){
    console.log(this.refundFields)
    this.refundFields['merchant_reference_id'] = this.conf;
    this.rapydService.processRefund(this.refundFields).subscribe(success => {
      this.isError = false;
      this.refunded = true;
    })
  }

  check(){
    this.rapydService.getCheckout(this.conf).subscribe(success => {
      if (success['status'] == 'ERROR') {
        this.isError = true;
        this.dataArr = success;            
      } else {
        this.isError = false;
        this.dataArr = success['details']
        this.dataArr['price'] = success['price']
        this.dataArr['purchase_info'] = success['purchase_info']
        this.refunded = this.dataArr['refunded']
        clearInterval(this.intervalId);
      }
  })
}

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  ngOnInit() {
    this.route.queryParams.subscribe(
      params => {
        this.conf = params['conf']
        this.rapydService.getCheckout(this.conf).subscribe(success => {
          if (success['status'] == 'ERROR') {
            this.isError = true;
            this.dataArr = success;   
            this.intervalId = setInterval(()=> {this.check()}, 5000);         
          } else {
            this.isError = false;
            this.dataArr = success['details']
            this.dataArr['price'] = success['price']
            this.dataArr['purchase_info'] = success['purchase_info']
            this.refunded = this.dataArr['refunded']
          }

          this.currencyService.selectedCurrencyCode = success['purchase_info']['preferred_currency'];

          this.flightId = success['purchase_info']['flightNo'];
          this.flightService.getFlights(this.flightId).subscribe(success => {
            this.flights = success;
          });

          if (this.rapydService.storedExchange[this.currencyService.selectedCurrencyCode] === undefined) {
            this.rapydService.getExchangeRate("USD", this.currencyService.selectedCurrencyCode).subscribe(exchangeRate => {
              console.log(exchangeRate);
              this.exchangeRate = this.rapydService.storedExchange[this.currencyService.selectedCurrencyCode] = 1 / exchangeRate.rate;
              // Store the exchange rate since it only changes once/day
              sessionStorage.setItem(exchangeRate.sell_currency, (1 / exchangeRate.rate).toString());
            });
          }
          else {
            this.exchangeRate = this.rapydService.storedExchange[this.currencyService.selectedCurrencyCode];
          }
        })


      }
    );
  }
}
