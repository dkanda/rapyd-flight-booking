import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { BookingFormComponent } from './components/booking-form/booking-form.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { ContactsBarComponent } from './components/contacts-bar/contacts-bar.component';
import { AboutBarComponent } from './components/about-bar/about-bar.component';
import { AppRoutes } from './app.routes';
import { HomePageComponent } from './components/home-page/home-page.component';
import { ViewComponent } from './components/view/view.component';
import { PlaceholderComponent } from './components/placeholder/placeholder.component';
import {PurchaseFormComponent} from './components/purchase/purchase-form.component';

import { FlightService } from './services/flight.service';
import { SelectedFlightService } from './services/selectedFlight.service';
import { CurrencyService } from './services/currency.service';
import { RapydService } from './services/rapyd.service';
import { PurchaseSuccessComponent } from './components/paymentsuccess/purchase-success.component';
import { CheckinComponent } from './components/checkin/checkin.component';
import { TicketComponent } from './components/ticket/ticket.component';
import { AboutComponent } from './components/about/about.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    BookingFormComponent,
    PurchaseFormComponent,
    NavBarComponent,
    ContactsBarComponent,
    HomePageComponent,
    ViewComponent,
    PlaceholderComponent,
    PurchaseSuccessComponent,
    CheckinComponent,
    TicketComponent,
    AboutComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot(AppRoutes),
    HttpClientModule
  ],
  providers: [
    FlightService,
    SelectedFlightService,
    CurrencyService,
    RapydService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
