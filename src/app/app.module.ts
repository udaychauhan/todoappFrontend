import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import {RouterModule} from '@angular/router';
import {HttpClientModule} from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {ToastModule} from 'ng2-toastr/ng2-toastr';

import { AppComponent } from './app.component';
import { SignupComponent } from './signup/signup.component';
import { LoginComponent } from './login/login.component';
import { ForgotpasswordComponent } from './forgotpassword/forgotpassword.component';
import { ChangepasswordComponent } from './changepassword/changepassword.component';
import { AngularFontAwesomeModule } from 'angular-font-awesome';

import { MytodoComponent } from './mytodo/mytodo.component';
import { HttpServiceService } from './http-service.service';
import { MytodoitemsComponent } from './mytodoitems/mytodoitems.component';
import { FriendsComponent } from './friends/friends.component';
import { FriendtodolistComponent } from './friendtodolist/friendtodolist.component';
import { FriendtodolistitemComponent } from './friendtodolistitem/friendtodolistitem.component';
import { EditItemComponent } from './edit-item/edit-item.component';

@NgModule({
  declarations: [
    AppComponent,
    SignupComponent,
    LoginComponent,
    ForgotpasswordComponent,
    ChangepasswordComponent,
    MytodoComponent,
    MytodoitemsComponent,
    FriendsComponent,
    FriendtodolistComponent,
    FriendtodolistitemComponent,
    EditItemComponent
   
  ],
  imports: [
    BrowserModule,HttpClientModule,
    FormsModule,
    ToastModule.forRoot(),BrowserAnimationsModule,
    RouterModule.forRoot([
      
      {path:'login',component:LoginComponent},
      {path:'signup',component:SignupComponent},
      {path:'',redirectTo:'login',pathMatch:'full'},
      
      {path:'forgotpassword',component:ForgotpasswordComponent},
      {path:'friends',component:FriendsComponent},
      {path:'editItem',component:EditItemComponent},
      //will use query params in url
      {path:'friendtodolist',component:FriendtodolistComponent},
      //will use query params in url
      {path:'friendtodolistitem',component:FriendtodolistitemComponent},
      {path:'friends',component:FriendsComponent},
      {path:'changepassword/:changePasswordToken',component:ChangepasswordComponent},
      //token here is generated by jwt
      //for password change not user login
       {path:'mytodo',component:MytodoComponent},
       {path:'mytodoitems/:mytodoid',component:MytodoitemsComponent},
      // {path:'chatroom/:chatroomid',component:ChatRoomComponent},
      { path: '*', component: LoginComponent },
      { path: '**', component: LoginComponent }
      ])
  ],
  providers: [HttpServiceService],
  bootstrap: [AppComponent]
})
export class AppModule { }