import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpServiceService } from '../http-service.service';

import { ToastsManager } from 'ng2-toastr/ng2-toastr';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})

export class SignupComponent implements OnInit {
  
  public firstName : string;
  public lastName : string;
  public emailId : string;
 
  public countryCode : string;
  public phoneNumber : number;
  public username : string;
  public password : string;
  public countryData;

  constructor(private _route: ActivatedRoute, private router: Router
    , public toastr: ToastsManager, public httpService: HttpServiceService, vcr: ViewContainerRef,private httpClient :  HttpClient) {
      this.toastr.setRootViewContainerRef(vcr);
     
  }

  ngOnInit() {
    this.httpClient.get('https://restcountries.eu/rest/v2/all').subscribe(data => {
      console.log(data);
      this.countryData = data;
    });
  
  }

  public singleCountryData;
  createUser(){
    
    let data = ` ${this.firstName}  ${this.lastName} ${this.emailId}  ${this.countryCode} ${this.phoneNumber} ${this.password}`
    console.log(data);

    //
    //1. send http request with user data
    //2. then check if success or error
    //3. if successful then move to login page
    let userData = {
      firstName: this.firstName,
      lastName:this.lastName,
      emailId: this.emailId,
      phoneNumber: this.phoneNumber,
      countryCode : this.countryCode,
      password: this.password,
    }

    console.log(userData);

    this.httpService.createUser(userData).subscribe(
      data => {
        let error = data.error;
        let message = data.message;
        if(error){
          this.toastr.error(message, 'Fail!!');
          console.log(data);
        }else{
          this.toastr.success(message, 'Success!');
          console.log(data);
          setTimeout(()=>{
            this.router.navigate(['/login']);
          },1000);
        }
       
      },
      error => {
         this.toastr.error(error.message, 'Oops!');
      }
     
    );

    return userData;


  }

}

