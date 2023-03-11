let users =[]
let typingUsers ={}
let pendingmessages ={}
let pendingmessagess={}

 const AddUser =(socketId, userId)=>{
    const user= {socketId,userId, status:"online"}
    if(users.length === 0){
    users.push(user)
    return user
    }else{   
   if(users.find(user => user.userId === userId)){
       return user;
   }else{
         users.push(user)
   }
    return user
        }
    }    
   
const AddtypingUsers = data =>{
  if(typingUsers[data.reciever] && !typingUsers[data.reciever].includes(parseInt(data.sender))){
    typingUsers[data.reciever] = [...typingUsers[data.reciever],parseInt(data.sender)]
     // let typers = [sender,reciever, pendingmessage]
      return typingUsers[data.reciever];
  }else  if(typingUsers[data.reciever] && typingUsers[data.reciever].includes(parseInt(data.sender))){
      return typingUsers[data.reciever];
  }else{
    typingUsers[data.reciever]= [parseInt(data.sender)]
    return typingUsers[data.reciever]
  }
}

  function removeTypingUser(data){
      if(!typingUsers[`${data.recievingclient}`] || typingUsers[`${data.recievingclient}`].length <= 1){
        return [];
    }else if(typingUsers[`${data.recievingclient}`].includes(parseInt(data.typingclient))){
      const index = typingUsers[`${data.recievingclient}`].findIndex(ind => parseInt(ind) === parseInt(data.typingclient))
      console.log("index",index)
       if(index !== -1){
          console.log("for example", [9].splice(0,1)[0])
           return typingUsers[`${data.recievingclient}`].splice(index,1)[0]
          }
        return typingUsers[`${data.recievingclient}`];
    }else{
        return typingUsers[`${data.recievingclient}`];
    }
  }
const updatePendingMessages =(data)=>{
 let mymessages = pendingmessagess[data.sender]
 
 if(mymessages){
     console.log("already has a communication link")
    let prevmessage = mymessages.find(dat => dat.reciever == data.reciever)
   let index = mymessages.findIndex(dat => dat.reciever == data.reciever)
   if(index !== -1){
    mymessages[index] = {reciever:data.reciever,pendingmessage: data.pendingmessage}
    return mymessages;
   }else{
    pendingmessagess[data.sender]= [{reciever:data.reciever, pendingmessage:data.pendingmessage}]
    return pendingmessagess[data.sender];   
   }
 }else{
     pendingmessagess[data.sender]= [{reciever:data.reciever, pendingmessage:data.pendingmessage}]
     return pendingmessagess[data.sender];
 }
}
// have an array of pending messages and the key would be the reciever while the value would be the sender
//sender:{reciever:"reciever",message:"message"}
//let eat ={"12":{sender:"1", reciever:"2", message:"hello"},"45":{sender:"2", reciever:"5", message:"hi"}}
const PendingMessages =(data)=>{
    const connectionKey = reciever.toString()+sender.toString()
    if(pendingmessages[connectionKey]){
        pendingmessages[connectionKey] = [...pendingmessages[connectionKey],{sender,reciever,connectionKey, pendingmessage}]
         // let typers = [sender,reciever, pendingmessage]
          return pendingmessages[reciever];
      }else{
        pendingmessages[connectionKey]= [{sender,reciever,connectionKey, pendingmessage}]
        return pendingmessages[connectionKey]
      }
}
 const fetchUser =(userId)=>{
  let user =  users.find(user => user.userId == userId)
        return user;
 }
 function removeUser(id){
    const index = users.findIndex(conn => conn.socketId === id || conn.userId === id)
    if(index !== -1){
          return users.splice(index,1)[0]
         }
 }
const getUsers =()=>{
    let userArray = []
    for (var i =0; i<users.length; i++){
        if(users[i].userId === "admin"){
            userArray.push(users[i].userId)
        }else{
            userArray.push(parseInt(users[i].userId))
        }
    }
    return userArray
}
module.exports= {
    AddUser,
    getUsers,
    fetchUser,
    AddtypingUsers,
    removeUser,
    removeTypingUser,
    PendingMessages,
    updatePendingMessages
}