import { Component, OnInit, ViewContainerRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { HttpServiceService } from '../http-service.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { SocketServiceService } from '../socket-service.service';
import {AngularFontAwesomeModule} from 'angular-font-awesome';
import * as $ from 'jquery';
import * as bootstrap from "bootstrap";


@Component({
  selector: 'app-mytodoitems',
  templateUrl: './mytodoitems.component.html',
  styleUrls: ['./mytodoitems.component.css'],
  providers: [SocketServiceService]
})

export class MytodoitemsComponent implements OnInit {

  public authToken: string;
  public userName: string;
  public userId: string;
  public socketId: string;
  public socketName: string;
  public roomName: string;
  public socketDisconnected: boolean;
  public todoListId: string;
  public todoItemTitle: string;
  public todoItemDetail: string;
  public todoListItemsArray;
  //----- edit item
  public editItemId : string;
  public prevItemTitle : string;
  public prevItemDetail : string;
  public editItemTitle : string;
  public editItemDetail : string;

  //---- change log
  public changelogId : string;
  public changelogItemId : string;
  public changelogUserId ; string;
  public changelogUsername : string;
  public changelogType : string;
  public changelogItemTitle : string;
  public changelogItemDetail : string;
  public changelogListId : string; // can obtain change log by list id only
  public changelogArray =[];
  public changelogArrayEmpty : boolean;

  public friendreqsend = "FRIEND REQUEST SEND";
  public friendrequestaccepted = "FRIEND REQUEST ACCEPTED";
  public friendchangeitems = "FRIEND CHANGED ITEMS";

  public changesMade : boolean;


  constructor(private _route: ActivatedRoute, private router: Router
    , public httpService: HttpServiceService, public toastr: ToastsManager,
    vcr: ViewContainerRef, public socketService: SocketServiceService) {

    this.toastr.setRootViewContainerRef(vcr);
    this.router.events.forEach((event) => {
      if (event instanceof NavigationStart) {
        this.socketService.disconnectSocket();
      }
    });
    this.todoListId = this._route.snapshot.paramMap.get('mytodoid');

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
    this.listenGeneralTodoListAction();
    this.onlineUserList();
    this.getAllTodoItems();
    this.getAllChangeLog();

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
        "Forever NOT alone!");
        
       }

       if(data.broadcastMessage === this.friendchangeitems){
        this.toastr.success( data.broadcastMessageByName+" has "+ data.broadcastMessageActionType + 
        " in todo list by id " + data.broadcastMessageListId,
        "Item Managed");
        this.getAllTodoItems();
        this.getAllChangeLog();
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
  }

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
        if (data.type === "todoItemCreated") {
          this.populateTodoItems(data.message);
        }

        if (data.type === "allTodoItems") {
          this.mountAllTodoItems(data.message);
        }

        if (data.type === "todoItemDeleted") {
          this.populateTodoItems(data.message);
        }

        if(data.type === "allChangelog"){
          this.mountAllChangelog(data.message);
        }

        if(data.type === "undoChangelog"){
          this.getAllTodoItems();
          this.getAllChangeLog();
        }

      });

  }//end listen for general todo list actions

  public mountAllTodoItems(data) : any {
    let error = data.error;
    let message = data.message;
    let responseData = data.data;

    if (error) {
      this.toastr.error(message, 'Fail!!');
      console.log(data);
      //setting items array to blank array
      this.todoListItemsArray = [];
    } else {
      if (data.status === 200) {
        this.toastr.success(message, 'Yeah!!');
        console.log(responseData);
        this.todoListItemsArray = responseData;
        console.log("todolist items array "+ this.todoListItemsArray);
      }
    }

  }//--mount all todo items

  public populateTodoItems(data): any {
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
        this.getAllTodoItems();
        this.getAllChangeLog();
      }
    }

  }//-- populate todo items

  public mountAllChangelog(data) : any {
    let error = data.error;
    let message = data.message;
    let responseData = data.data;

    if (error) {
      this.toastr.error(message, 'Fail!!');
      console.log(data);
      //setting items array to blank array
      this.changelogArray = [];
      this.changelogArrayEmpty = true;
      } else {
      if (data.status === 200) {
        this.toastr.success(message, 'Yeah!!');
        console.log(responseData);
        this.changelogArray = responseData;
        console.log("chnage log array "+ this.changelogArray);
        this.changelogArrayEmpty = false;
        let clElement = this.changelogArray[0];

        this.changelogId = clElement.clId;
        this.changelogUserId = clElement. clUserId;
        this.changelogUsername = clElement.clUserName;
        this.changelogListId = clElement.clTodoListId;
        this.changelogItemId = clElement.clItemId;
        this.changelogItemTitle = clElement.clItemTitle;
        this.changelogItemDetail = clElement.clItemDetail;
        this.changelogType = clElement.clType;     
        
      }
    }

  }//--mount all change log

  public getAllTodoItems() : any  {
    console.log(" listen get all todo items")
    let data = {
      userId : this.userId,
      todoListId : this.todoListId
    }
    this.socketService.getAllTodoItems(data);
  }//--end get all todo items

  public getAllChangeLog() : any {
    let data = {
      userId : this.userId,
      todoListId : this.todoListId,
    }
    this.socketService.getAllChangelog(data);
  }//--- end get latest change log

  public onlineUserList: any = () => {
    this.socketService.onlineUserListListener()
      .subscribe((data) => {

        if (data.message == "join") {
          //this.toastr.info(data.sendBy + " joined", "Info.");
        } else {
         // this.toastr.info(data.sendBy + " left", "Info.");
        }

        console.log(data + " new user connected/ disconnected");

        let onlineUserArray: any = [];
        onlineUserArray = data.list;
      });
  }//end online user list

  public makeTodoItem(): any {
    //this.toastr.info("Make Todo item.");
    console.log('wassup');

    // let userId = data.userId;
    // let userName = data.userName;
    // let todoListId = data.todoListId;
    // let itemTitle = data.itemTitle;
    // let itemDetail = data.itemDetail;
    // let parentItemId = data.parentItemId;//maybe
    // let parentItemTitle = data.parentItemTitle;//maybe

    let data = {
      userId: this.userId,
      userName: this.userName,
      todoListId : this.todoListId,
      itemTitle: this.todoItemTitle,
      itemDetail: this.todoItemDetail
      //for parent item we will use another modal
    }

    console.log(JSON.stringify(data));
     this.socketService.createNewTodoItem(data);
  }//end maek todo item

  public editItem(toBeEditedItemId,prevItemTitle,prevItemDetail) : any {
    this.prevItemDetail = prevItemDetail;
    this.prevItemTitle = prevItemTitle;
    let info = toBeEditedItemId +" "+ this.prevItemTitle + " "+this.prevItemDetail+ " "+ this.editItemTitle + " "+this.editItemDetail;
    console.log(info);
    // let userId = this.userId;
    // let userName = this.userName;
    // let todoListId = this.todoListId;
    // let itemId = toBeEditedItemId;
    // let itemTitle = this.editItemTitle;
    // let itemDetail = this.editItemDetail;
    //this.toastr.info("Editing Todo item.");

    let data = {
      userId : this.userId,
      userName : this.userName,
      todoListId : this.todoListId,
      itemId : toBeEditedItemId,
      itemTitle : this.editItemTitle,
      itemDetail : this.editItemDetail,
      prevItemTitle : this.prevItemTitle,
      prevItemDetail : this.prevItemDetail
    }
    
    console.log(JSON.stringify(data));
  }//end edit item

  public deleteTodoItem(toBeDeletedItemId) : any {
    // let userId = data.userId;
    // let userName = data.userName;
    // let todoListId = data.todoListId;
    // let itemId = data.itemId;
    // let itemTitle = data.itemTitle;
    // let itemDetail = data.itemDetail;
    //this.toastr.info("Deleting Todo item.");
    
    let data = {
      userId: this.userId,
      userName: this.userName,
      todoListId : this.todoListId,
      itemTitle: this.todoItemTitle,
      itemDetail: this.todoItemDetail,
      itemId : toBeDeletedItemId
    }

    console.log(JSON.stringify(data));
    this.socketService.deleteTodoItem(data);
  }//end delete todo item

  public undo(){
    //this is how changelog/undo works
    //--- only those actions that are done by user are kept in changelog
    // actions performed by changelog on itself are removed after performing
    //--- a changelog is disnguished only by its id and filtered by list id
    //---- change log contains 
    // public changelogId : string;
    // public changelogItemId : string;
    // public changelogUserId ; string;
    // public changelogUsername : string;
    // public changelogType : string;
    // public changelogItemTitle : string;
    // public changelogItemDetail : string;
    // public changelogListId : string; // can obtain change log by list id only

    // we will get only one changelog at a time 
    console.log("undo method" );
    if(this.changelogArrayEmpty){
      this.toastr.warning('No More undo actions',"Hey!!");
      return;
    }
    let data = {
      userId: this.changelogUserId,
      userName: this.changelogUsername,
      todoListId : this.changelogListId,
      itemTitle: this.changelogItemTitle,
      itemDetail: this.changelogItemDetail,
      itemId : this.changelogItemId,
      clId : this.changelogId,
      clType : this.changelogType
      //for parent item we will use another modal
    }
    console.log(JSON.stringify(data));
    this.socketService.undoChangeLog(data);
  
  }//end undo method

  public redirectToFriendsComponent() : any {
    setTimeout(() => {
      this.router.navigate(['/friends']);
    }, 1000);

  }//redirect friends component

  public onUndoButton: any = (event: any) => {
    console.log("works");
    this.undo();
  } // end undo button

  public redirectToEditItem(itemId) : any {
    console.log("Item id id is " + itemId);
    let itemTitle;
    let itemDetail;

    for (let  item of this.todoListItemsArray){
      if(item.itemId === itemId){
        itemTitle =  item.itemTitle;
        itemDetail = item.itemDetail;
        break;
      }
    }
    


    setTimeout(() => {
      this.router.navigate(['/editItem'],{ queryParams: {'todoListId':this.todoListId
      ,'itemId':itemId,'itemTitle':itemTitle,'itemDetail':itemDetail}});
      }, 1000);

  }//redirect todo list items
}
