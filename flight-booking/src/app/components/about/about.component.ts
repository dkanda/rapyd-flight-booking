import { Component, OnInit } from '@angular/core';
import { Route } from '@angular/compiler/src/core';
import { Router } from '@angular/router';
declare function initRocket(): any; // just change here from arun answer.


@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  constructor(private router : Router) { }

  ngOnInit() {
    initRocket();
  }

  navigateToBooking(){
    this.router.navigate(['booking']);
    console.log('heyyyy');
  }
}
