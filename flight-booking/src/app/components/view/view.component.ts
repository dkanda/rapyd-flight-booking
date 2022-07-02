import { Component, OnInit } from '@angular/core';
import { Route, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css']
})
export class ViewComponent implements OnInit {

  clientName : string;
  clientId : string;
  city : string;
  flightClass : string;
  departDate: string;
  returnDate : string;

  constructor(private route: ActivatedRoute) { 
    
  }

  ngOnInit() {
    this.route.queryParams.subscribe(
      params => {
        this.clientName =  params['clientName'];
        this.clientId =  params['clientId'];
        this.city =  params['city'];
        this.flightClass = params['flightClass'];
        this.departDate =  params['departDate'];
        this.returnDate =  params['returnDate'];
      }
    );
  }

}
