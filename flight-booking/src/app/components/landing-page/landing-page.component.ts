import { Component, OnInit } from '@angular/core';
import { Route } from '@angular/compiler/src/core';
import { Router } from '@angular/router';
declare function initRocket(): any; // just change here from arun answer.


@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {

  constructor(private router : Router) { }

  ngOnInit() {
    initRocket();
  }

  navigateToBooking(){
    this.router.navigate(['booking']);
    console.log('heyyyy');
  }
}
