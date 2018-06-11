import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpServiceService } from '../http-service.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';

@Component({
  selector: 'app-changepassword',
  templateUrl: './changepassword.component.html',
  styleUrls: ['./changepassword.component.css']
})
export class ChangepasswordComponent implements OnInit {

  public password : string;
  public changePasswordToken : string;
  

  constructor(private _route: ActivatedRoute, private router: Router
    , public httpService: HttpServiceService, public toastr: ToastsManager, vcr: ViewContainerRef) {
    this.toastr.setRootViewContainerRef(vcr);
  }

  ngOnInit() {
    this.changePasswordToken = this._route.snapshot.paramMap.get('changePasswordToken');
    console.log(this.changePasswordToken);
    if(!this.changePasswordToken){
      this.toastr.error("Change Password Token Missing", 'TOKEN MISSING');
    }
  }


  changePassword() {
    //1. get changepasswordtoken from url
    //2. then using that token show email id
    //3. then propmt user to change password and then edit user detail with new password
   
    let userData = {
      password: this.password,
      authToken : this.changePasswordToken
    }

    console.log(userData);

    this.httpService.changePassword(userData).subscribe(

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
