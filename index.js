const express = require("express")
const conn = require("./routes/conn")
const RItems = require("./routes/items")
const RClients = require("./routes/clients")
const http = require("http")
const cors = require("cors")
const nodemailer = require("nodemailer")
const { AddUser , fetchUser, AddtypingUsers, removeTypingUser, removeUser, getUsers } = require("./resource")

const app = express()
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server,
  {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });
app.set('socketio', io);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'yexies4ogb@gmail.com',
      pass: 'oszwncszxcxqsajh'
    }
})
transporter.verify(function(error, success) {
    if (error) {
          console.log(error);
    } else {
          console.log('Server is ready to take our messages from index route');
    }
  });



 app.use(cors())
app.use("/item",RItems)
app.use("/client",RClients)
const savedmessages ={}
const lastchatuser={}

io.on("connection", socket =>{
  socket.on("adduser", id =>{
    const user = AddUser(socket.id, id )
    const onlineclients = getUsers()
    console.log("user is connected", user, onlineclients)
    io.emit("onlineclients", onlineclients)
  })
  socket.on("fetchsavedmessages", (data)=>{
    socket.emit("savedmessages", savedmessages[`${data}`])
    conn.query()
  })
  socket.on("typingto", (data)=>{
    const typer = fetchUser(parseInt(data.typingclient))
    const typee = fetchUser(parseInt(data.recievingclient))
    const typers = AddtypingUsers(data)
    savedmessages[`${data.sender}`]={...savedmessages[`${data.sender}`], [`${data.reciever}`]:data.message}
    if((typee && typee.socketId) && (typer && typer.userId)){
      socket.broadcast.to(typee.socketId).emit("incomingmessage", typer.userId)
      socket.broadcast.to(typee.socketId).emit("typers", typers)  
    }    
   })
   socket.on("untyping", (data)=>{
    const typer = fetchUser(data.typingclient)
    const typee = fetchUser(data.recievingclient)
    const typers = removeTypingUser(data)
  
    savedmessages[`${data.sender}`]={...savedmessages[`${data.sender}`], [`${data.reciever}`]:data.message}
    socket.on("addlastchatuser", data=>{
      let thirdparty = data.thirdparty
      let currentuser= data.currentuser
      lastchatuser[`${currentuser}`] =thirdparty;
    })
    socket.on("fetchlastchatuser",(currentuser)=>{
      socket.emit("lastchatuser", lastchatuser[`${currentuser}`])
    })
    if((typee && typee.socketId) && (typer && typer.userId)){
      socket.broadcast.to(typee.socketId).emit("incomingmessage", typer.userId)
      socket.broadcast.to(typee.socketId).emit("typers", typers)  
    }    
   })
   const recentlyViewed={}

   socket.on("recently viewed", data=>{
    if(recentlyViewed[`${data.customerId}`]){
     recentlyViewed[`${data.customerId}`]= {...recentlyViewed, [`${data.customerId}`]:[...recentlyViewed[`${data.customerId}`],data.productId]}
    }else{
     recentlyViewed[`${data.customerId}`]= {...recentlyViewed, [`${data.customerId}`]:[data.productId]}
    }
    console.log("recentlyViewed",recentlyViewed)
   })
   socket.on("send message", data =>{
    let d = new Date()
    const todaydate = `${d.getDay()}/${d.getMonth()}/${d.getFullYear()}`
    const sender = fetchUser(data.sender)
   const reciever = fetchUser(data.reciever)
   savedmessages[`${data.sender}`]={...savedmessages[`${data.sender}`], [`${data.reciever}`]:""}
  
   if(reciever && reciever.socketId && sender && sender.socketId){
      conn.query(`select * from connections where (conn1 = ? and conn2 = ?) or (conn2 =? and conn1=?) `, 
      [parseInt(data.sender),parseInt(data.reciever),parseInt(data.sender),parseInt(data.reciever)], (err, connectiondetails)=>{
        if (err) throw err;
        if(connectiondetails && connectiondetails[0]){
      conn.query("insert into messages (connId,message,sender,reciever, date, time,status, message_store, message_storeId, message_dispatch, message_dispatchId) values (?,?,?,?,?,?,?,?,?,?,?)",
      [connectiondetails[0].connid,data.message,parseInt(data.sender),parseInt(data.reciever),todaydate,d.getTime(),"delivered",data.store, data.storeId, data.dispatch, data.dispatchId], (err, result) =>{
        if (err) throw err;
       data["status"] = "delivered"
       socket.broadcast.to(reciever.socketId).emit("recieving message", data)
       socket.emit("message status delivered",data)
       console.log("message inserted in db")
      })
    }
  })
   }
    else if(sender && sender.socketId){
      socket.broadcast.to(sender.socketId).emit("recieving message", data)
      conn.query(`select * from connections where (conn1 = ? and conn2 = ?) or (conn2 =? and conn1=?);
      select * from customers where customerId=?`, 
      [parseInt(data.sender),parseInt(data.reciever),parseInt(data.sender),parseInt(data.reciever),data.reciever], (err, connectiondetails)=>{
        if (err) throw err;
        if(connectiondetails[0] && connectiondetails[0][0]){
      conn.query(`select * from messages where status !=? and connId=?;
      insert into messages (connId,message,sender,reciever, date, time,status, message_store, message_storeId, message_dispatch, message_dispatchId) values (?,?,?,?,?,?,?,?,?,?,?)`,
      [connectiondetails[0][0].connid,data.message,parseInt(data.sender),parseInt(data.reciever),todaydate,d.getTime(),"sent",data.store, data.storeId, data.dispatch, data.dispatchId,"seen",connectiondetails[0][0].connid], (err, result) =>{
        if (err) throw err;
        console.log("results[0] ", result[0].length)
        if(result[0] && result[0].length === 0){
          console.log("its his first time")
              const storemailOptions ={
                  from :`"Fruget[You Have recieved a new message]" @${d} @<yexies4ogb@gmail.com>`,
                  to:connectiondetails[1][0].email,
                  subject:`You Have recieved a new message @${d}`,
                  attachments: [{
                    filename: 'fruget.jpg',
                    path: __dirname+'/fruget.jpg',
                    cid: 'unique@fruget.ee'
                }],
                  html:` 	<div style="justify-content: center;padding:20px">	
                  <p>Hi ${connectiondetails[1][0].name},</p>          
                <div style="position: absolute;width:80%;left:10%;top:20%">
                  <center>
                  <h1 style="padding: 30px;color:grey">New message</h1>
                  <p>You Just Recieved A New  Message</p>
                  <small>Feb 18, 08:28pm </small><br/><br/>
                  <button style="background-color: blue;color:white;border:none;padding: 20px 40px;border-radius: 5px">
                    Open Message
                  </button>
                </center>
                </div>
                <div class="footer" style="background-color: rgba(245,245,245,0.7);padding: 0">
              <div style="padding:5px 10px;border-top: 1px solid lightgrey;border-bottom: 1px solid lightgrey;color:lightgrey">
                  <small>This email is intended for Eze Ogbonnaya, @ no 30 owode street iwaya yaba lagos state and cannot be replied to but kindly disregard if you are not the above mentioned contact</small>
              </div>
              </div>
              <div style="color:indianred;padding: 20px;position: absolute;width:100%;left:10%;bottom: 0px">
                <center>
                <small>
                  <img src="./logo.png" style="height: 20px">
                </small><br/>
                <small>Contact: <b>08169319476/ 07031974963</b></small><br/>
                <small>@ fruget services limited, Address : No 1, coaste street oyingbo- ebutte meta</small><br/>
                <small>Lagos Mainland</small>
                <small>Lagos state, Nigeria.</small>
              </center>
              </div>
                
              </div>`}
              transporter.sendMail(storemailOptions, (err,info)=>{
                  if (err) throw err;
                  console.log("email sent")
                  data["status"] = "sent"
                  socket.emit("message status sent",data)
                           console.log("message inserted in db, there was a connection")
              })
         }
          })
        }else{
          conn.query(`insert into connections (conn1,conn2,conndate, conntime) values (?,?,?,?)`,
          [parseInt(data.sender),parseInt(data.reciever)], ( err, insertedconn)=>{
            if (err) throw err;
            if(insertedconn && insertedconn){
              conn.query("insert into messages (connId,message,sender,reciever, date, time,status,message_store, message_storeId, message_dispatch, message_dispatchId) values (?,?,?,?,?,?,?,?,?,?,?)",
              [insertedconn.insertId,data.message,parseInt(data.sender),parseInt(data.reciever),todaydate,d.getTime(),"sent",data.store, data.storeId, data.dispatch, data.dispatchId], (err, result) =>{
                if (err) throw err;
                  const storemailOptions ={
                      from :`"Fruget[You Have recieved a new message]" @${d} @<yexies4ogb@gmail.com>`,
                      to:connectiondetails[1][0].email,
                      subject:`You Have recieved a new message @${d}`,
                      attachments: [{
                        filename: 'fruget.jpg',
                        path: __dirname+'/fruget.jpg',
                        cid: 'unique@fruget.ee'
                    }],
                      html:` 	<div style="justify-content: center;padding:20px">	
                      <p>Hi ${connectiondetails[1][0].name},</p>          
                    <div style="position: absolute;width:80%;left:10%;top:20%">
                      <center>
                      <h1 style="padding: 30px;color:grey">New message</h1>
                      <p>You Just Recieved A New  Message</p>
                      <small>Feb 18, 08:28pm </small><br/><br/>
                      <button style="background-color: blue;color:white;border:none;padding: 20px 40px;border-radius: 5px">
                        Open Message
                      </button>
                    </center>
                    </div>
                    <div class="footer" style="background-color: rgba(245,245,245,0.7);padding: 0">
                  <div style="padding:5px 10px;border-top: 1px solid lightgrey;border-bottom: 1px solid lightgrey;color:lightgrey">
                      <small>This email is intended for Eze Ogbonnaya, @ no 30 owode street iwaya yaba lagos state and cannot be replied to but kindly disregard if you are not the above mentioned contact</small>
                  </div>
                  </div>
                  <div style="color:indianred;padding: 20px;position: absolute;width:100%;left:10%;bottom: 0px">
                    <center>
                    <small>
                      <img src="./logo.png" style="height: 20px">
                    </small><br/>
                    <small>Contact: <b>08169319476/ 07031974963</b></small><br/>
                    <small>@ fruget services limited, Address : No 1, coaste street oyingbo- ebutte meta</small><br/>
                    <small>Lagos Mainland</small>
                    <small>Lagos state, Nigeria.</small>
                  </center>
                  </div>
                    
                  </div>`}
                  transporter.sendMail(storemailOptions, (err,info)=>{
                      if (err) throw err;
                      console.log("email sent")
                      data["status"] = "sent"
                      socket.emit("message status sent",data)
                 console.log("message inserted in db, there was no connection")
                  })
             
                  })
                }
          })
        }
      })
        }else{
          console.log("no sender or reciever ")
        }
  })
  socket.on("hiredispatchrequest", data=>{
    const tkt = data.tkt;
    const indexermain = parseInt(tkt.split("bkop")[1])
    const otheruser= data.dispatchtohire.dispatch_customerId
    const request_sender = fetchUser(parseInt(indexermain))
    const request_receiver = fetchUser(parseInt(otheruser))
    const d=new Date()
    const randOne = Math.floor(Math.random()*10000)
    const randTwo = Math.floor(Math.random()*10000)
    const randThree = Math.floor(Math.random()*10000)
    const invoiceNo = randOne*randTwo*randThree
    conn.query(`insert into dispatch_hire 
    (hire_customerId,hire_dispatchId, hire_to, hire_from, hire_invoiceNo, hire_item,hire_status, hire_date, hire_time)
     values (?,?,?,?,?,?,?,?,?)`,
     [indexermain, data.dispatchtohire.dispatch_customerId, data.hireinput.to,data.hireinput.from, invoiceNo,data.hireinput.description, "pending",d, Date.now() ],
     (err, inserted)=>{
      if (err) throw err;
      if(inserted && inserted.affectedRows > 0){
    if(request_receiver && request_receiver.socketId && request_sender && request_sender.socketId){
      socket.broadcast.to(request_receiver.socketId).emit("recievinghiredispatchrequest", data)
      console.log("sending request hire")
    }else if(request_sender && request_sender.socketId){
     //upload in the database
   const datamessage={
    message:`An email notification has been sent to ${data.dispatchtohire.dispatch_name}`,
    status:"success"
   }
     socket.emit("hirerequeststatussettorecieved", datamessage)
    }else{
      console.log("couldnt process request")
    }
  }else{
    const datamessage={
      message:`An error occured while trying to process this request, please try again in a few minutes`,
      status:"failure"
     }
    socket.emit("hirerequeststatussettoerr", datamessage)
  }
})
  })
  socket.on('disconnect', () => { 
    socket.emit("disconnected")
console.log('A client just left'); 
const userleaving = removeUser(socket.id); 
console.log(userleaving)
if(userleaving && userleaving.userId){
   const d = new Date()
io.emit("lastseen",userleaving)
   console.log("userleaving",userleaving)
   conn.query("update customers set lastseen = ? where customerId =?",[d.getTime(), parseInt(userleaving.userId)], (err, result)=>{
       if (err) throw err;
       console.log("lastseen updated in db")
   })
   
}
  const getallUsers = getUsers()
  io.emit("online users", getallUsers) 
 });                     

 //  const onlineclients = getUsers()
  // console.log("online users", onlineclients)

    socket.on("check_saved_notifications", ()=>{
        const d = new Date()
        let date = d.getDate()
        let month = d.getMonth()
        let year = d.getFullYear()
        month = date >= 13 ? month : month > 0 ? month - 1 :11
        date = date >= 13 ? date - 13 : 30 + date -13

        d.setFullYear(year,month,date)
         const prev_time = d.getTime()
         console.log(prev_time, new Date().getTime())
      conn.query(`select * from savedProducts where time_notified <= ? and customerId =?`,[prev_time,1],(err, saveditems)=>{
        if (err) throw err;
        console.log(saveditems.length)
        if(saveditems && saveditems.length > 0){
        
         const mailOptions ={
            from :`E.O.Eze'n'Bros Merchandize <yexies4ogb@gmail.com>`,
            to:`ezeogbonnayajnr@yahoo.com`,
            subject:`Repository Reminder`,
            html: `<div>
                <p>Hi Dear,<br/>
                Remember you saved a couple products and are yet to revisit them...
                </p>
                <small>Kindly click this link to redirect you to your repository</small>
            </div>`
         }
         transporter.sendMail(mailOptions,(err, info)=>{
            if (err) throw err;
            let savedIds =[]
            saveditems.forEach(saved => {
                savedIds.push(saved.savedProductId)
            });
            console.log(savedIds)
           if(info){
            conn.query(`update savedProducts set time_notified =? where customerId =? and savedProductId IN (${savedIds})`,[Date.now(),1],(err, done)=>{
                if (err) throw err;
               if(done){
                console.log("done")
               }
            })
           }
         }) 
        }else{
            console.log("no saved item exceeds 2 weeks")
        }
      })
    })
    
 
})
app.get("/fetch_user",(req, res)=>{
  conn.query(`select * from customers where customerId=?`,[req.query.pdx], (err, user)=>{
      if (err) throw err;
      if(user.length > 0){
          res.json({status:'success', user:user})
      }
  })
})
app.get("/fetch-connections",(req,res)=>{
  const tkt = req.query.tkt;
  const indexermain = parseInt(tkt.split("bkop")[1])
  conn.query("select conn2 from pendingconnections where conn1 =?",[indexermain],(err, pendingconn)=>{
      if (err) throw err;
      conn.query("select conn1 from pendingconnections where conn2 =?",[indexermain],(err, requestedconn)=>{
          if (err) throw err;
  conn.query(`SELECT 
  *
FROM
  connections 
      Left JOIN
  customers  ON (connections.conn1 = customers.customerId or connections.conn2 = customers.customerId)
  left join (select * from messages m inner join (select max(id) as maxid,connId as connectionId from messages group by connectionId )
   as mess on (mess.maxid=m.id) order by maxid desc) as messagee on (messagee.connId = connections.connid)
   left join (SELECT connId as connunread,count(*) as noofunread FROM chatapp.messages where reciever =? and status != "seen" group by connId )
    messes  on (connections.connid=messes.connunread)
   where (connections.conn1=? or connections.conn2=?) and customers.customerId != ?
  group by connections.connid  order by messagee.time desc`,[indexermain,indexermain,indexermain,indexermain],(err, connections)=>{
      if (err) throw err;
    //   ON connections.conn1 = users.userid or connections.conn2 = users.userid  where users.userid !=
    res.json({pendingconn,requestedconn,connections})
  })
})
  })
})
app.get(`/fetch_unreadmessages`,(req,res)=>{
  const tkt = req.query.tkt;
  const indexermain = parseInt(tkt.split("bkop")[1])
  if(indexermain){
  conn.query(`select * from messages inner join customers on messages.sender = customers.customerId where reciever=? and status =? group by sender order by id desc;
   select * from messages inner join customers on messages.sender=customers.customerId where reciever=? and status =? `,[indexermain,"delivered",indexermain,"delivered"],(err, unreadmessages)=>{
    if(err) throw err;
 conn.query("select * from messages where reciever = ? order by id DESC limit 1", [indexermain], (err, lastmessagerow)=>{
    if (err) throw err;
    console.log("lastmessagerow",lastmessagerow[0].sender, unreadmessages[0].length, unreadmessages[1].length)
    //unreadmessages[unreadmessages.length -1] && unreadmessages[unreadmessages.length -1]
res.json({status:"success",noOfUnreadMessages:unreadmessages[1],noOfUnreadChat:unreadmessages[0],lastunreadindex:lastmessagerow[0].sender})
})
})
  }
})
app.get(`/fetch_messages`, (req, res) =>{
  const tkt = req.query.tkt;
  const indexermain = parseInt(tkt.split("bkop")[1])
  const pdx = req.query.pdx
  conn.query(`select connId from connections where (conn1 = ? and conn2 = ?) or (conn2 =? and conn1=?)`,
  [parseInt(indexermain),parseInt(pdx),parseInt(indexermain),parseInt(pdx)], (err, connidentity)=>{
    if (err) throw err;
    if(connidentity && connidentity[0]){
    conn.query("select * from messages inner join connections on (messages.connId = connections.connid) where messages.connId = ?", [connidentity[0].connId], (err, result)=>{
        if (err) throw err;
        res.json({status:"success", messages:result})
    })
}
})
})
// if(process.env.NODE_ENV === "production"){ 
//   app.use(express.static("frontend/build"))
  
//   app.get('*',(req,res)=>{
//       res.sendFile(path.join(__dirname, 'frontend','build', 'index.html'));
//   })
//   }  
app.get("/", (req, res)=>{
  conn.query(`select * from stores s inner join
  (select store from product x where x.generalcategory = 'electronics' group by x.store) as p on p.store = s.company_name`,(err, data)=>{
    if (err) throw err
    res.send(data)
  })
})
const port = process.env.PORT || 5000;
server.listen(port, ()=>{
    console.log(`your server is running on port ${port}`)
})