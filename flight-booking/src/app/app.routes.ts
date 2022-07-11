import { LandingPageComponent } from "./components/landing-page/landing-page.component";
import { BookingFormComponent } from "./components/booking-form/booking-form.component";
import { ContactsBarComponent } from "./components/contacts-bar/contacts-bar.component";
import { HomePageComponent } from "./components/home-page/home-page.component";
import { ViewComponent } from "./components/view/view.component";
import { PlaceholderComponent } from "./components/placeholder/placeholder.component";
import {PurchaseFormComponent} from './components/purchase/purchase-form.component';
import { PurchaseSuccessComponent } from "./components/paymentsuccess/purchase-success.component";
import { CheckinComponent } from "./components/checkin/checkin.component";
import { TicketComponent } from "./components/ticket/ticket.component";
import { AboutComponent } from "./components/about/about.component";


export const AppRoutes = [
    {path:'', component:LandingPageComponent},
    {path:'booking', component:BookingFormComponent},
    {path:'about', component: AboutComponent},
    {path:'purchase', component: PurchaseFormComponent},
    {path:'purchase-success', component: PurchaseSuccessComponent},
    {path:'checkin', component: CheckinComponent},
    {path: 'ticket', component: TicketComponent},
    {path:'home', component:HomePageComponent, children:[
        {path:'view', component:ViewComponent},
        {path:'contacts', component:ContactsBarComponent},
        {path:'', component:PlaceholderComponent}
    ]}
];