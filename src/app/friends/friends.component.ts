import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { HttpServiceService } from '../http-service.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { SocketServiceService } from '../socket-service.service';
import {AngularFontAwesomeModule} from 'angular-font-awesome';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css'],
  providers: [SocketServiceService]
})
export class FriendsComponent implements OnInit {

  public authToken: string;
  public userName: string;
  public userId: string;
  public socketId: string;
  public socketName: string;
  public roomName: string;
  public socketDisconnected: boolean;
  public allUserList;
  public friendRequestList;
  
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
    this.listenForBroadcastMessage();
    this.getAllUsers();
    this.getAllMyFriendRequest();
    
  }

  public listenForBroadcastMessage : any = () =>{
    this.socketService.broadcastMessageListListener()
    .subscribe((data) => {
      // let messageFor = [{
      //   messageForUserId : freindRequestReceiverId or senderId
      //   messageForUsername : rname
      // }]

      // let data = {
        // broadcastMessageBy : this.userId,
        // broadcastMessageByName : this.userName,
        // broadcastMessageFor : messageFor,
        // broadcastMessage : this.friendrequestaccepted,
        // //to be used when we edit,add,delete items and undo changelog
        // //ADD,DELETE,EDIT,UNDO
        // broadcastMessageListId : "",
        // broadcastMessageItemId :"",
        // broadcastMessageActionType : "",// }

        let messageForMe = false;
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
        this.getAllMyFriendRequest();
       }

       if(data.broadcastMessage === this.friendrequestaccepted){
        this.toastr.success( data.broadcastMessageByName+" accepted your friend request",
        "Forever not alone!");
        this.getAllMyFriendRequest();
       }

       if(data.broadcastMessage === this.friendchangeitems){
        this.toastr.success( data.broadcastMessageByName+" has "+ data.broadcastMessageActionType + 
        " in todo list by id " + data.broadcastMessageListId,
        "Item Managed");
       }
             
    });
  }//end listen for broacast message

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

  public getAllUsers : any = () => {
    this.httpService.getAllUsers(this.authToken).subscribe(
      data => {
        let error = data.error;
        let message = data.message;
        let result = data.data;
        if(error){
          this.toastr.error(message, 'Fail!!');
          console.log(data);
          this.allUserList = [];
        }else{
          //this.toastr.success("Got all users.", 'Success!');
          this.allUserList = result;
          // for(let user of this.allUserList){
          //   console.log(user.firstName);
          // }
          console.log(result);
        }
      },
      error => {
          this.toastr.error(error.message, 'Oops!');
      }
    );
  }// end get all users

  public sendFriendRequest : any = (freindRequestReceiverId) =>{
    let rname;
    for(let use of this.allUserList){
      if(use.userId === freindRequestReceiverId){
         rname = use.firstName + " " + use.lastName;
      }
    }
   
    let friendReqData = {
      senderId : this.userId,
      receiverId : freindRequestReceiverId,
      senderUsername : this.userName,
      receiverUsername : rname,
      status : 1,
      authToken : this.authToken
    }
    console.log("friend request data" + JSON.stringify(friendReqData));
    //send http request
    //check if already friends or request already exists
    //and shpw toast that you send request if positive
    //then broadcast
    this.httpService.sendFriendRequest(friendReqData).subscribe(
      data => {
        let error = data.error;//boolean
        let message = data.message;
        let result = data.data;
        if(error){
          this.toastr.error(message, 'Fail!!');
          console.log(data);
        }else{
          this.toastr.success("Friend Request Send", 'Success!');
          console.log(result);
          this.getAllMyFriendRequest();
          let messageFor = [{
            messageForUserId : freindRequestReceiverId,
            messageForUsername : rname
          }]

          let data = {
            broadcastMessageBy : this.userId,
            broadcastMessageByName : this.userName,
            broadcastMessageFor : messageFor,
            broadcastMessage : this.friendreqsend,
            //to be used when we edit,add,delete items and undo changelog
            //ADD,DELETE,EDIT,UNDO
            broadcastMessageListId : "",
            broadcastMessageItemId :"",
            broadcastMessageActionType : ""
          }

          this.socketService.broadcastMessage(data);
        }
      },
      error => {
          console.log(error);
          this.toastr.error(error.message, 'Oops!');
      }
    );
  }//end send friend request

  public getAllMyFriendRequest : any = () =>{
    let userData = {
      userId : this.userId,
      authToken : this.authToken
    }
    console.log("user request data" + JSON.stringify(userData));
    this.httpService.getFriendRequest(userData).subscribe(
      data => {
        let error = data.error;//boolean
        let message = data.message;
        let result = data.data;
        if(error){
          this.toastr.error(message, 'Fail!!');
          console.log(data);
          this.friendRequestList = [];
        }else{
         // this.toastr.success("Got all Friend Requests", 'Success!');
          this.friendRequestList = result;
          console.log(result);
        }
      },
      error => {
          console.log(error);
          this.toastr.error(error.message, 'Oops!');
      }
    );
  }//get all my friend request
  

  public acceptFriendRequest : any = (senderId) =>{
    console.log("freidn request sendder id "+senderId);
    let rname;
    for(let use of this.allUserList){
      if(use.userId === senderId){
         rname = use.firstName + " " + use.lastName;
      }
    }
    let data =  {
      senderId : senderId,
      receiverId : this.userId,
      authToken : this.authToken,
      status : 2
    }

    console.log(JSON.stringify(data))

    this.httpService.acceptFriendRequest(data).subscribe(
      data => {
        let error = data.error;//boolean
        let message = data.message;
        let result = data.data;
        if(error){
          this.toastr.error(message, 'Fail!!');
          console.log(data);
        }else{
          this.toastr.success("Friend Request Accepted", 'Success!');
          console.log(result);
          this.getAllMyFriendRequest();

          let messageFor = [{
            messageForUserId : senderId,
            messageForUsername : rname
          }]

          let data = {
            broadcastMessageBy : this.userId,
            broadcastMessageByName : this.userName,
            broadcastMessageFor : messageFor,
            broadcastMessage : this.friendrequestaccepted,
            //to be used when we edit,add,delete items and undo changelog
            //ADD,DELETE,EDIT,UNDO
            broadcastMessageListId : "",
            broadcastMessageItemId :"",
            broadcastMessageActionType : ""
          }

          this.socketService.broadcastMessage(data);
        }
      },
      error => {
          console.log(error);
          this.toastr.error(error.message, 'Oops!');
      }
    );
  }//end accept freid request

  public checkIfFriendsthenRoute : any = (a,b) =>{
    //here ambiguity is that userId == senderId or ==receiverId
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
        this.toastr.error(message, 'Fail!!');
        console.log(data);
      }else{
        this.toastr.success("You are friends", 'Success!');
        console.log(result);
        let friendId;
        let friendUsername;

        if(result.senderId === this.userId){
          friendId = result.receiverId;
          //checking if user has name if not then giving him a name
          if(result.receiverUsername){
            friendUsername = result.receiverUsername;
          }else{
            friendUsername = "NO NAME";
          }
          
        }else{
          friendId = result.senderId;
          if(result.senderUsername){
            friendUsername = result.senderUsername;
          }else{
            friendUsername = "NO NAME";
          }
        }

        setTimeout(()=>{
          this.router.navigate(['/friendtodolist'],{ queryParams: { 'friendId': friendId , 
          'friendUsername':friendUsername}});
  
        },1000);
       }
    },
    error => {
        console.log(error);
        this.toastr.error(error.message, 'Oops!');
    });
  }//end checkIfFriendsthenRoute

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

}
