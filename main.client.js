var conversationLogDB = new Mongo.Collection("conversationLog");
var conversationLog = new ReactiveVar("ELIZA: How are you doing?");

Session.setDefault("currentPage", "frontPage");
Session.setDefault("userSession", "");

Tracker.autorun(function() {
  Meteor.subscribe("userConversation", Session.get("userSession"));
});

Template.body.helpers({
  checkCurrentPage: function(page) {
    return Session.equals("currentPage", page);
  }
});

Template.mainSection.helpers({
  getConversation: function() {
    let dbData = conversationLogDB.find({}, {sort: {time: 1}});
    dbData = dbData.fetch();
    let conversationLog = "";
    for(let index=0 ; index<dbData.length ; index++) {
      let msgData = dbData[index];
      conversationLog = conversationLog+msgData.source+": ";
      conversationLog = conversationLog+msgData.msg+"\n";
    }
    return conversationLog;
  }
});

Template.formSection.events({
  "click #submitMsg": function(event) {
    event.preventDefault();
    let myMsgObj = document.getElementById("myMsg");
    let myMsg = myMsgObj.value;
    Meteor.call("msgReceiver", myMsg, Session.get("userSession"), function(error, result) {
      if(error) {

      }
      else if(result === "full") {
        alert("The database is full!");
      }
      else {

      }
    });
    myMsgObj.value = "";
  },
  "click #resetMsg": function() {
    Meteor.call("resetMsg", Session.get("userSession"));
  },
  "click #resetUser": function() {
    Session.set("userSession", "");
    Session.set("currentPage", "frontPage");
  }
});

Template.frontPage.events({
  "click #enterMain": function() {
    let username = document.getElementById("username").value;
    Meteor.call("setUser", username, function(error, result) {
      if(error) {
        alert("Username cannot have any space!");
      }
      else {
        Session.set("userSession", username);
        Session.set("currentPage", "home");
      }
    });
  }
});