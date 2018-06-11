import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { HttpServiceService } from '../http-service.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { SocketServiceService } from '../socket-service.service';
import * as $ from 'jquery'

@Component({
  selector: 'app-mytodo',
  templateUrl: './mytodo.component.html',
  styleUrls: ['./mytodo.component.css'],
  providers: [SocketServiceService]
})
export class MytodoComponent implements OnInit {

  public authToken: string;
  public userName: string;
  public userId: string;
  public socketId: string;
  public socketName: string;
  public roomName: string;
  public socketDisconnected: boolean;
  public newTodoListName: string;
  public todoListTitle: string;
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

    //this.socketService.initialiseSocket();
    this.listenVerifyUserConfirmation();
    this.listenUserSetConfirmation();
    this.listenForError();
    this.listenSocketDisconnect();
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

  

  public checkStatus: any = () => {
    if (this.authToken === undefined || this.authToken === '' || this.authToken === null) {
      this.router.navigate(['/']);
      return false;
    } else {
      return true;
    }
  }//end check status

  public listenVerifyUserConfirmation: any = () => {
    this.socketService.verifyUser()
      .subscribe((data) => {
        this.socketDisconnected = false;
        //this.toastr.info(data.message, "Info.");
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
  }

  public listenSocketDisconnect: any = () => {
    this.socketService.disconnectedSocketListener()
      .subscribe((data) => {
        this.socketDisconnected = true;
        this.toastr.error(data, "SOCKET DISCONNECTED.");
      });
  }

  public onlineUserList: any = () => {
    this.socketService.onlineUserListListener()
      .subscribe((data) => {

        if (data.message == "join") {
          //this.toastr.info(data.sendBy + " joined", "Info.");
        } else {
          //this.toastr.info(data.sendBy + " left", "Info.");
        }

        console.log(data + " new user connected/ disconnected");

        let onlineUserArray: any = [];
        onlineUserArray = data.list;
      });
  }//end online user list

  public getAllTodoList() : any {
    let data = {
      userId : this.userId
    }
    this.socketService.getAllTodoList(data);
  }

  public listenGeneralTodoListAction(): any {
    this.socketService.generalTodoListActionListener()
      .subscribe((data) => {
        
        
        if (data.type === "todoListCreated") {
          this.populateTodoList(data.message);
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
       // this.toastr.success(message, 'Voila!!');
        console.log(responseData);
        this.getAllTodoList();
      }
    }

  }//get all todo list

  public makeTodoList(): any {
   // this.toastr.info("Make Todo List.");
    console.log('wassup');

    let data = {
      userId: this.userId,
      userName: this.userName,
      todoListTitle: this.todoListTitle
    }
    this.socketService.createNewTodoList(data);

   
  

  }//create new todo list

  public redirectToFriendsComponent() : any {
    setTimeout(() => {
      this.router.navigate(['/friends']);
    }, 1000);

  }//redirect friends component

  public redirectToTodoList(todoListId) : any {
    console.log("list id is " + todoListId);

    setTimeout(() => {
      this.router.navigate(['/mytodoitems', todoListId]);
    }, 1000);

  }//redirect todo list

  public deleteTodoList(todoListId) : any {
    console.log("list id is " + todoListId);
   // this.toastr.info("Deleting Todo item.");
   
    let data = {
     todoListId : todoListId,
     userId : this.userId,
    }

    console.log(JSON.stringify(data));
    this.socketService.deleteTodoList(data);

  }//delete todo list

}
