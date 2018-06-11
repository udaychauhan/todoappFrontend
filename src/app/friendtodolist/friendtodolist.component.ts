import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { HttpServiceService } from '../http-service.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { SocketServiceService } from '../socket-service.service';
import {AngularFontAwesomeModule} from 'angular-font-awesome';

@Component({
  selector: 'app-friendtodolist',
  templateUrl: './friendtodolist.component.html',
  styleUrls: ['./friendtodolist.component.css'],
  providers: [SocketServiceService]
})
export class FriendtodolistComponent implements OnInit {

  public authToken: string;
  public userName: string;
  public userId: string;
  public socketId: string;
  public socketName: string;
  public roomName: string;
  public socketDisconnected: boolean;
  private _urlParams;
  public allUserList;
  public friendId;
  public friendUsername;
  public todoListArray = [];

  public friendreqsend = "FRIEND REQUEST SEND";
  public friendrequestaccepted = "FRIEND REQUEST ACCEPTED";
  public friendchangeitems = "FRIEND CHANGED ITEMS";

  
  constructor(private _route: ActivatedRoute, private router: Router
    , public httpService: HttpServiceService, public toastr: ToastsManager,
    vcr: ViewContainerRef, public socketService: SocketServiceService) {

    this.toastr.setRootViewContainerRef(vcr);
    this.router.events.forEach((event) => {
      if (event instanceof NavigationStart) {
        this.socketService.disconnectSocket();
      }
    });
  }

  ngOnInit() {
    this.socketDisconnected = true;
    this.authToken = Cookie.get('authToken');
    this.checkStatus();
    let userInfo = this.httpService.getUserInfoFromLocalstorage();
    this.userName = userInfo.firstName + " " + userInfo.lastName;
    this.userId = userInfo.userId;

    this.listenVerifyUserConfirmation();
    this.listenUserSetConfirmation();
    this.listenForError();
    this.listenSocketDisconnect();
    this.onlineUserList();
    
    let urlParam = this.filterUrl();
    this._urlParams = urlParam;
    if(this.checkIfUrlParamsAreEmpty(this._urlParams)){
      console.log("user params empty")
      this.toastr.error("URL PARAMS ARE EMPTY REDIRECTING TO LOGIN", "INVALID ACCESS!");
      //if empty relocate
      setTimeout(()=>{
        this.router.navigate(['/']);
        },2000);
     
    }else{
       //if valid check if are friends
       this.checkIfFriends(this.userId,this._urlParams.friendId);
       //if not friends we will redirect to login page
    }

    //atlast if everythignis alright
      this.friendId = this._urlParams.friendId;
      this.friendUsername = this._urlParams.friendUsername;

      this.listenGeneralTodoListAction();
      this.onlineUserList();
      this.getAllTodoList();

    //----friend item edit broadcast message
    this.listenForBroadcastMessage();
  }

  public listenForBroadcastMessage : any = () =>{
    this.socketService.broadcastMessageListListener()
    .subscribe((data) => {
      // let messageFor = [{
      //   messageForUserId : freindRequestReceiverId or senderId
      //   messageForUsername : rname
      // }]

      // let data = {
      //   broadcastMessageBy : this.userId,
      //   broadcastMessageByName : this.userName,
      //   broadcastMessageFor : messageFor,
      //   broadcastMessage : this.friendreqsend or this.friendrequestaccepted,
      // //to be used when we edit,add,delete items and undo changelog
      //       //ADD,DELETE,EDIT,UNDO
      //       broadcastMessageListId : "",
      //       broadcastMessageItemId :"",
      //       broadcastMessageActionType : "",
      // }

        let messageForMe = false;
        //broadcastMessageFor is an array of userids
        for (let user of data.broadcastMessageFor){
          if(user.messageForUserId === this.userId){
            messageForMe = true;
            break;
          }
        }

        if(!messageForMe){
          return;
        }

       if(data.broadcastMessage ===  this.friendreqsend){
        this.toastr.info("You have got a friend request from "+data.broadcastMessageByName,
        "Wannabe Friend!");
        
       }

       if(data.broadcastMessage === this.friendrequestaccepted){
        this.toastr.success( data.broadcastMessageByName+" accepted your friend request",
        "Forever not alone!");
        
       }

       if(data.broadcastMessage === this.friendchangeitems){
        this.toastr.success( data.broadcastMessageByName+" has "+ data.broadcastMessageActionType + 
        " in todo list by id " + data.broadcastMessageListId,
        "Item Managed ");
       }
             
    });
  }//end listen for broacast message

  filterUrl(): any {
    let urlParams;
     this._route.queryParams.subscribe( params =>{
       urlParams = params;
     });
     return urlParams;
  }//end filter url

  public checkIfUrlParamsAreEmpty  : any = (urlparams) =>{
    let friendUserId = urlparams.friendId;
    let friendUsername = urlparams.friendUsername;
    //we need both to be there
    if(this.isEmpty(friendUserId) || this.isEmpty(friendUsername)){
      console.log("one or both user params empty")
      return true;
    }else{
      return false;
    }
   
  }//check if url params are valid

  public isEmpty = (value) => {
    if (value === null || value === undefined || this.trim(value) === '' || value.length === 0) {
      return true
    } else {
      return false
    }
  }

  public trim = (x) => {
    let value = String(x)
    return value.replace(/^\s+|\s+$/gm, '')
  }

  public checkIfFriends : any = (a,b) =>{
    
    console.log(a + " " + b);
    let data = {
      senderId : a,
      receiverId : b,
      authToken : this.authToken
    }

    this.httpService.checkIfFriends(data).subscribe( data => {
      let error = data.error;//boolean
      let message = data.message;
      let result = data.data;
      if(error){
        console.log(data);
        this.toastr.error(message, "INVALID ACCESS!");
        setTimeout(()=>{
        this.router.navigate(['/']);
        },2000);
      }else{
        this.toastr.success("You are friends", 'Success!');
        console.log(result);
        
       }
    },
    error => {
        console.log(error);
        this.toastr.error(error.message, 'Oops!');
    });
  }//end checkIfFriends
  
  public checkStatus: any = () => {
    if (this.authToken === undefined || this.authToken === '' || this.authToken === null) {
      this.router.navigate(['/']);
      return false;
    } else {
      return true;
    }
  }//end check status method

  public listenVerifyUserConfirmation: any = () => {
    this.socketService.verifyUser()
      .subscribe((data) => {
        this.socketDisconnected = false;
       // this.toastr.info(data.message, "Info.");
        let authData = {
          authToken: Cookie.get('authToken'),
          userId: this.userId
        }
        this.socketService.setUser(authData);
      });
  }//end verify user consfirmation

  public listenUserSetConfirmation: any = () => {
    this.socketService.listenUserSetConfirmation()
      .subscribe((data) => {

       // this.toastr.info("User Set.", "Info.");
        this.socketId = data.socketId;
        this.socketName = data.socketName;
        this.roomName = data.roomName;

      });
  }//end verify user consfirmation

  public listenForError: any = () => {
    this.socketService.errorListener()
      .subscribe((data) => {
        this.toastr.error(data, "Error");
      });
  }//end listen for error

  public listenSocketDisconnect: any = () => {
    this.socketService.disconnectedSocketListener()
      .subscribe((data) => {
        this.socketDisconnected = true;
        this.toastr.error(data, "SOCKET DISCONNECTED.");
      });
  }//end listen for scoket disconnect

  public onlineUserList: any = () => {
    this.socketService.onlineUserListListener()
      .subscribe((data) => {

        if (data.message == "join") {
         // this.toastr.info(data.sendBy + " joined", "Info.");
        } else {
          //this.toastr.info(data.sendBy + " left", "Info.");
        }

        console.log(data + " new user connected/ disconnected");

        let onlineUserArray: any = [];
        onlineUserArray = data.list;
      });
  }//end online user list

  public listenGeneralTodoListAction(): any {
    this.socketService.generalTodoListActionListener()
      .subscribe((data) => {
        
        
        if (data.type === "todoListCreated") {
          this.populateTodoList(data.message);
          //populate todo list action returns only the todolist single item
          //which is just confrimation that list is created
        }

        if (data.type === "allTodoList") {
          this.mountAllTodoList(data.message);
        }

        if (data.type === "todoListDeleted") {
          this.populateTodoList(data.message);
        }
      });

  }//general todo list action listener

  public mountAllTodoList(data) : any {
    let error = data.error;
    let message = data.message;
    let responseData = data.data;

    if (error) {
      this.toastr.error(message, 'Fail!!');
      console.log(data);
      this.todoListArray = [];
    } else {
      if (data.status === 200) {
        this.toastr.success(message, 'Yeah!!');
        console.log(responseData);
        this.todoListArray = responseData;
        console.log("todolist array "+ this.todoListArray);
      }
    }

  }//mount all todo list

  public populateTodoList(data): any {
    let error = data.error;
    let message = data.message;
    let responseData = data.data;

    if (error) {
      this.toastr.error(message, 'Fail!!');
      console.log(data);
    } else {
      if (data.status === 200) {
        //this.toastr.success(message, 'Voila!!');
        console.log(responseData);
        this.getAllTodoList();
      }
    }

  }//populate all todo list

  public getAllTodoList() : any {
    let data = {
      userId : this.friendId//we will use friend id to get his todo lists
    }
    this.socketService.getAllTodoList(data);
  }//get all todo list

  public redirectToTodoList(todoListId) : any {
    console.log("list id is " + todoListId);

    setTimeout(() => {
      this.router.navigate(['/friendtodolistitem'],{ queryParams: { 'friendId': this.friendId , 
          'friendUsername':this.friendUsername , 'friendTodolistid':todoListId}});
      }, 1000);

  }//redirect todo list items

}
