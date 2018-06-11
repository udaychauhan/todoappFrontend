import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';

@Injectable()
export class HttpServiceService {

  public baseUrl = 'http://todoapi.udaychauhan.info/api/v1/users';
   //'http://localhost:3001/api/v1/users';

  constructor(private _http: HttpClient) {
    console.log("http service was called");
  }

  public createUser(userData): any {
    let myResponse = this._http.post(this.baseUrl + '/signup', userData);
    return myResponse;
  }

  public loginUser(userData): any {
    let myResponse = this._http.post(this.baseUrl + '/login', userData);
    return myResponse;
  }

  public getUserInfoFromLocalstorage = () => {
    return JSON.parse(localStorage.getItem('userInfo'));
  } // end getUserInfoFromLocalstorage


  public setUserInfoInLocalStorage = (data) => {
    localStorage.setItem('userInfo', JSON.stringify(data))
  }

  public sendEmailForPasswordChange(userData): any {
    let myResponse = this._http.post(this.baseUrl + '/forgotpassword', userData);
    return myResponse;
  }

  public changePassword(userData): any {
    let myResponse = this._http.post(this.baseUrl + '/changePassword', userData);
    return myResponse;
  }

  public getAllUsers(authToken) : any {
    let myResponse = this._http.get(this.baseUrl +'/view/all?authToken='+authToken);
    return myResponse;
  }

  public sendFriendRequest(userData) : any {
    let myResponse = this._http.post(this.baseUrl + '/addToFriendRequest', userData);
    return myResponse;
  }

  public acceptFriendRequest(userData) : any {
    let myResponse = this._http.post(this.baseUrl + '/acceptFriendRequest', userData);
    return myResponse;
  }

  public getFriendRequest(userData) : any {
    //user data contains only userid and auth token
    let myResponse = this._http.post(this.baseUrl + '/getFriendRequest', userData);
    return myResponse;
  }

  public checkIfFriends(userData) : any {
    let myResponse = this._http.post(this.baseUrl + '/areFriends', userData);
    return myResponse;
  }

}
