import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {CurrencyService} from './../../services/currency.service';

declare function initAutocomplete(): any;

@Component({
  selector: 'app-booking-form',
  templateUrl: './booking-form.component.html',
  styleUrls: ['./booking-form.component.css']
})
export class BookingFormComponent implements OnInit {

  destination : string = "";
  departDate : string = "";
  currencies: Array<Object>;
  selectedCurrency: Object;
  selectedCurrencyID: number;

  constructor(private router: Router, private currencyService: CurrencyService) { }

  ngOnInit() {
    initAutocomplete();
    this.currencies = this.currencyService.currencies;
    console.log(this.currencies)
  }

  processData(){
    this.currencyService.setCurrencyFromCurrencyID(this.selectedCurrencyID)
    
    this.router.navigate(['home'], {
      queryParams:{
        'destination': this.destination,
        'departDate': this.departDate,
        'curId': this.selectedCurrencyID
      }
    });
  }
}
