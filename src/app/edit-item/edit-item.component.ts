import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { HttpServiceService } from '../http-service.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { SocketServiceService } from '../socket-service.service';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { Location } from '@angular/common';


@Component({
  selector: 'app-edit-item',
  templateUrl: './edit-item.component.html',
  styleUrls: ['./edit-item.component.css'],
  providers: [SocketServiceService, Location]
})
export class EditItemComponent implements OnInit {

  public authToken: string;
  public userName: string;
  public userId: string;
  public socketId: string;
  public socketName: string;
  public roomName: string;
  public socketDisconnected: boolean;
  private _urlParams;
  public allUserList;
  public todoListId;
  public itemId;

  public itemTitle: string;
  public itemDetail: string;
  public prevItemTitle: string;
  public prevItemDetail: string;

  public friendRequestList;
  public friendreqsend = "FRIEND REQUEST SEND";
  public friendrequestaccepted = "FRIEND REQUEST ACCEPTED";
  public friendchangeitems = "FRIEND CHANGED ITEMS";

  constructor(private _route: ActivatedRoute, private router: Router
    , public httpService: HttpServiceService, public toastr: ToastsManager,
    vcr: ViewContainerRef, public socketService: SocketServiceService, private location: Location) {

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
    if (this.checkIfUrlParamsAreEmpty(this._urlParams)) {
      console.log("user params empty")
      this.toastr.error("URL PARAMS ARE EMPTY REDIRECTING TO LOGIN", "INVALID ACCESS!");
      //if empty relocate
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 3000);

    }
    //atlast if everythignis alright
    this.todoListId = this._urlParams.todoListId;
    this.itemId = this._urlParams.itemId;
    this.prevItemDetail = this._urlParams.itemDetail;
    this.prevItemTitle = this._urlParams.itemTitle;

    // if you are friends then you can do anyting with the items
    this.listenGeneralTodoListAction();
    this.onlineUserList();

    //-- broadcast message
    this.listenForBroadcastMessage();
    this.getAllMyFriendRequest();//we will use all freinds to send broadcast message

  }//end init()

  public listenForBroadcastMessage: any = () => {
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
        for (let user of data.broadcastMessageFor) {
          if (user.messageForUserId === this.userId) {
            messageForMe = true;
            break;
          }
        }

        if (!messageForMe) {
          return;
        }

        if (data.broadcastMessage === this.friendreqsend) {
          this.toastr.info("You have got a friend request from " + data.broadcastMessageByName,
            "Wannabe Friend!");
          this.getAllMyFriendRequest();
        }

        if (data.broadcastMessage === this.friendrequestaccepted) {
          this.toastr.success(data.broadcastMessageByName + " accepted your friend request",
            "Forever not alone!");
          this.getAllMyFriendRequest();
        }

        if (data.broadcastMessage === this.friendchangeitems) {
          this.toastr.success(data.broadcastMessageByName + " has " + data.broadcastMessageActionType +
            " in todo list by id " + data.broadcastMessageListId,
            "Item Managed ");

        }

      });
  }//end listen for broacast message

  public getAllMyFriendRequest: any = () => {
    let userData = {
      userId: this.userId,
      authToken: this.authToken
    }
    console.log("user request data" + JSON.stringify(userData));
    this.httpService.getFriendRequest(userData).subscribe(
      data => {
        let error = data.error;//boolean
        let message = data.message;
        let result = data.data;
        if (error) {
          this.toastr.error(message, 'Fail!!');
          console.log(data);
          this.friendRequestList = [];
        } else {
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


  filterUrl(): any {
    let urlParams;
    this._route.queryParams.subscribe(params => {
      urlParams = params;
    });
    return urlParams;
  }//end filter url

  public checkIfUrlParamsAreEmpty: any = (urlparams) => {

    let todoListId = urlparams.todoListId;
    let itemId = urlparams.itemId;
    let title = urlparams.itemTitle;
    let detail = urlparams.itemDetail;
    //we need both to be there
    if (this.isEmpty(todoListId) || this.isEmpty(itemId) || this.isEmpty(title) || this.isEmpty(detail)) {
      console.log("one or all  params empty")
      return true;
    } else {
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

  public listenGeneralTodoListAction(): any {
    console.log(" listen general todo list action")
    this.socketService.generalTodoListActionListener()
      .subscribe((data) => {
        if (data.type === "editListItem") {
          this.itemEditedCallback(data.message);
          this.sendListItemEditBroadcastMessage('EDIT');
        }


      });

  }//end listen for general todo list actions

  public itemEditedCallback: any = (data) => {
    let error = data.error;
    let message = data.message;
    let responseData = data.data;

    if (error) {
      this.toastr.error(message, 'Fail!!');
      console.log(data);

    } else {

      this.toastr.success(message, 'Yeah!!');
      console.log(responseData);
      setTimeout(() => {
        this.goBackToPreviousPage();
      }, 2000);
      this.toastr.warning("Redirecting you to previous page!", 'Okay');

    }

  }//item edited callback

  //will be called from general tod list aciton listener
  public sendListItemEditBroadcastMessage(type): any {
    let messageFor = [];
    for (let friend of this.friendRequestList) {
      if (friend.status === 2) {
        let friendId = "";
        let friendName = "";

        if (friend.senderId === this.userId) {
          friendId = friend.receiverId;
          friendName = friend.receiverUsername;
        } else {
          friendId = friend.senderId;
          friendName = friend.senderUsername;
        }

        let obj = {
          messageForUserId: friendId,
          messageForUsername: friendName
        }

        messageFor.push(obj);
      }
    }


    let data = {
      broadcastMessageBy: this.userId,
      broadcastMessageByName: this.userName,
      broadcastMessageFor: messageFor,
      broadcastMessage: this.friendchangeitems,
      //to be used when we edit,add,delete items and undo changelog
      //ADD,DELETE,EDIT,UNDO
      broadcastMessageListId: this.todoListId,
      broadcastMessageItemId: "",
      broadcastMessageActionType: type
    }

    this.socketService.broadcastMessage(data);

  }//end broadcast message method

  public goBackToPreviousPage(): any {
    this.location.back();
  }//going back}

  public onlineUserList: any = () => {
    this.socketService.onlineUserListListener()
      .subscribe((data) => {

        if (data.message == "join") {
          // this.toastr.info(data.sendBy + " joined", "Info.");
        } else {
          // this.toastr.info(data.sendBy + " left", "Info.");
        }

        console.log(data + " new user connected/ disconnected");

        let onlineUserArray: any = [];
        onlineUserArray = data.list;
      });
  }//end online user list

  public editItem(): any {

    let info = this.itemId + " " + this.itemTitle + " " + this.itemDetail + " " + this.todoListId + " " + this.userName;
    console.log(" edit item called " + info);

    this.toastr.info("Editing Todo item.");

    let data = {
      userId: this.userId,
      userName: this.userName,
      todoListId: this.todoListId,
      itemId: this.itemId,
      itemTitle: this.itemTitle,
      itemDetail: this.itemDetail,
      prevItemTitle: this.prevItemTitle,
      prevItemDetail: this.prevItemDetail
    }

    console.log(JSON.stringify(data));
    this.socketService.editItem(data);
  }//end edit item

}
