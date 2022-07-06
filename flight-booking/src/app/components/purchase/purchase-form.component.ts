import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Flight } from 'src/app/model/flight';
import { CurrencyService } from 'src/app/services/currency.service';
import { FlightService } from 'src/app/services/flight.service';
import { RapydService } from 'src/app/services/rapyd.service';
import { SelectedFlightService } from 'src/app/services/selectedFlight.service';

@Component({
  selector: 'app-purchase-form',
  templateUrl: './purchase-form.component.html',
  styleUrls: ['./purchase-form.component.css']
})
export class PurchaseFormComponent implements OnInit {

  destination: string = "";
  departDate: string = "";
  data: Flight;
  loading = false;
  exchangeRate = 1;
  amountDue = 0;
  flightId = 0;

  BASE_URL = 'http://localhost:4200';
  MERCHANT_NAME = "Sling Shot Space";

  constructor(private route: ActivatedRoute, private router: Router, protected selectedFlight: SelectedFlightService, protected flightService: FlightService, protected currencyService: CurrencyService, protected rapydService: RapydService) { }

  ngOnInit() {
    this.route.queryParams.subscribe(
      params => {
        this.flightId = params['id']
        if (this.selectedFlight.flight === undefined) {
          this.flightService.getFlights().subscribe(success => {
            let i = 0;
            while (success[i].id != params['id']) {
              i++;
            }
            this.data = success[i];
          });
        } else {
          this.data = this.selectedFlight.flight;
        }

        this.currencyService.setCurrencyFromCurrencyID(params['curId'])
        if (sessionStorage.getItem(this.currencyService.selectedCurrencyCode)) {
          this.exchangeRate = parseFloat(sessionStorage.getItem(this.currencyService.selectedCurrencyCode))
        }
        this.amountDue = (1000 + (this.data.price)) / 2; // Amount DUE in USD
      }
    );

  }

  purchase() {
    this.loading = true;
    this.rapydService.createCheckoutPage({
      currency: this.currencyService.selectedCurrencyCode,
      country: this.currencyService.selectedCountryCode,
      flight: this.data['id']
    }).subscribe(success => {
      console.log(success);
      this.router.navigate(['/purchase-success'],
        { queryParams: { id: this.flightId, currency: this.currencyService.selectedCurrencyCode, conf: success['conf'] } }
      );
    })
  }

  processData() {
    this.router.navigate(['home'], {
      queryParams: {
        'destination': this.destination,
        'departDate': this.departDate,
      }
    });
  }
}
