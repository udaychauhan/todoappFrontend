import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpServiceService } from '../http-service.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';

@Component({
  selector: 'app-forgotpassword',
  templateUrl: './forgotpassword.component.html',
  styleUrls: ['./forgotpassword.component.css']
})
export class ForgotpasswordComponent implements OnInit {

  
  public emailId : string;
   

  constructor(private _route: ActivatedRoute, private router: Router
    , public httpService: HttpServiceService, public toastr: ToastsManager, vcr: ViewContainerRef) {
    this.toastr.setRootViewContainerRef(vcr);
  }

  ngOnInit() {
  
  }

  changePassword() {
    //1. take email id
    //2. then send node mail to that email id wiht changepasswordtoken
    //3. get confirmation of success or error
    //4. if successful then move to change password
    let userData = {
      emailId: this.emailId,
    }

    console.log(userData);

    this.httpService.sendEmailForPasswordChange(userData).subscribe(

      data => {
        let error = data.error;
        let message = data.message;
        if(error){
          this.toastr.error(message, 'Fail!!');
          console.log(data);
        }else{
          this.toastr.success("Check your email id.", 'Success!');
          console.log(data);
          //let token = message;
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
