import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpServiceService } from '../http-service.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { Cookie } from 'ng2-cookies/ng2-cookies';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  
  public emailId : string;
  public password : string;

  public checkErrorFromBackend : boolean;
  

  constructor(private _route: ActivatedRoute, private router: Router
    , public toastr: ToastsManager, public httpService: HttpServiceService, vcr: ViewContainerRef,private httpClient :  HttpClient) {
      this.toastr.setRootViewContainerRef(vcr);
     
  }

  ngOnInit() {
  
  }

  loginUser() {
    let data = ` ${this.emailId}  ${this.password}`
    console.log(data);
    //1. first do login http call
    //2. then checck if login successful
    //3. if successful then STORE AUTH TOKEN AND USER INFO
    //4. then move to mytodo page
    let userData = {
      emailId: this.emailId,
      password: this.password,
    }

    console.log(userData);

    this.httpService.loginUser(userData).subscribe(

      data => {
        let error = data.error;
        let message = data.message;
        let authToken = data.data.authToken;
        if (error) {
          this.toastr.error(message, 'Fail!!');
          console.log(data);
          this.checkErrorFromBackend = true;
          setTimeout( ()=>{
            this.checkErrorFromBackend = false;
          },5000);
        } else {
          if (data.status === 200) {
            Cookie.set('authToken', authToken);
            this.httpService.setUserInfoInLocalStorage(data.data.userDetails);
            this.toastr.success(message, 'Success!');
            console.log(data.data);
            setTimeout(() => {
              this.router.navigate(['/mytodo']);
            },
              2000);
          }

        }

      },
      error => {

        this.toastr.error(error.message, 'Oops!');
        this.checkErrorFromBackend = true;
          setTimeout( ()=>{
            this.checkErrorFromBackend = false;
          },5000);
      }
    );

    return userData;
  }

  signUp() {
    setTimeout(()=>{
      this.router.navigate(['/signup']);
    },1000);
  }

  forgotPassword() {
    setTimeout(()=>{
      this.router.navigate(['/forgotpassword']);
    },1000);
  }
}
