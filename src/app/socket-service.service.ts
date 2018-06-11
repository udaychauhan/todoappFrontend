import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';

import { Observable } from 'rxjs/Observable';
import { Cookie } from 'ng2-cookies/ng2-cookies';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/toPromise';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HttpErrorResponse, HttpParams } from "@angular/common/http";

@Injectable()
export class SocketServiceService {

  private url = 'http://todoapi.udaychauhan.info';//'http://localhost:3001/';//
                
  private socket;

  constructor(public http: HttpClient) {
    console.log('Socket service called');
    this.initialiseSocket();
  }

  public initialiseSocket =() =>{
    this.socket = io(this.url);
  }

  //-----EMIT EVENTS
  public disconnectSocket = () => {
    this.socket.disconnect();
  }

  public setUser = (authData) => {
    // this will set socket id after verifying from token
    this.socket.emit('setUser',authData);
  }

  public getAllTodoList = (data) => {
    this.socket.emit('getAllTodoList',data);
  }

  public getAllTodoItems = (data) => {
    this.socket.emit('getAllTodoItems',data);
  }

  public getAllChangelog = (data) => {
    this.socket.emit('getAllChangelog',data);
  }
 
  public undoChangeLog = (data) =>{
    this.socket.emit('undoChangelog',data);
  }

  public createNewTodoList = (data) => {
    this.socket.emit('createNewTodoList',data);
  }

  public deleteTodoList = (data) => {
    this.socket.emit('deleteTodoList',data);
  }

  public createNewTodoItem = (data) => {
    this.socket.emit('createNewTodoItem',data);
  }

  public deleteTodoItem = (data) => {
    this.socket.emit('deleteTodoItem',data);
  }

  public editItem = (data) =>{
    this.socket.emit("editListItem",data);
  }
  
  public broadcastMessage = (data) => {
    this.socket.emit('broadcastMessage',data);
  }
  //-----LISTEN EVENTS
  public verifyUser = () => {
    let obs = Observable.create((observer) => {
      this.socket.on('verifyUser', (data) => {
        console.log(data);
        observer.next(data);
      });
    });
    return obs;
  }

  public listenUserSetConfirmation = () => {
    let obs = Observable.create((observer) => {
      this.socket.on('userSet', (data) => {
        console.log(data);
        observer.next(data);
      });
    });
    return obs;
  }

  public onlineUserListListener = () => {
    let obs = Observable.create((observer) => {
      this.socket.on('onlineUserList', (data) => {
        console.log(data);
        observer.next(data);
      });
    });
    return obs;
  }

  public generalTodoListActionListener = () => {
    let obs = Observable.create((observer) => {
      this.socket.on('generalTodoListAction', (data) => {
        console.log(data);
        observer.next(data);
      });
    });
    return obs;
  }
  
  public errorListener = () => {
    let obs = Observable.create((observer) => {
      this.socket.on('errorEvent', (data) => {
        console.log(data);
        observer.next(data);
      });
    });
    return obs;
  }//--error listener

  public broadcastMessageListListener = () => {
    let obs = Observable.create((observer) => {
      this.socket.on('broadcastMessage', (data) => {
        console.log(data);
        observer.next(data);
      });
    });
    return obs;
  }//-- broadcast message listener

  

  public disconnectedSocketListener = () => {
    return Observable.create((observer) => {
      this.socket.on("disconnect", () => {
        observer.next();
      }); // end Socket
    }); // end Observable
  }
 

}
