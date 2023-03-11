const express = require ("express")
const mysql = require("mysql")
const nodemailer = require("nodemailer")
const upload = require("./multer")
const cloudinary = require("cloudinary")
const cloudinaries =require ("./cloudinary")
const fs = require("fs")
// const getDistanceFromLatLonInKm = require(`./mapdistance`)

require('dotenv').config()

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
  })

  /**
   * const storage = multer.diskStorage({
   * destination:(req, cb, file)=>{
   * cb(null, "./ogbmain/folder")}})
   * fileName :(req, cb, file)=>{
   * cb(null, Date().now + file.originalName)}
   * const uploads = multer({
   * storage,
   * fileFilter
   * })
   */

const conn = mysql.createPool({
    connectionLimit : 1000,
    connectTimeout  : 60 * 60 * 1000,
    acquireTimeout  : 60 * 60 * 1000,
    timeout         : 60 * 60 * 1000,

    host: 'localhost',
    user: 'root',
    //b9b001ef539d5b 
    password: 'password',
    //8b36306e 
    database: 'chatapp',
    //heroku_ea5621dea112dad 
    multipleStatements: true,
   // connectionLimit : 20,  
    waitForConnections : true
})

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
          console.log('Server is ready to take our from client route');
    }
  });


const router = express.Router()

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
  }
  
  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }

router.get("/client", (req, res)=>{
    conn2.query(`select * from submittedcart`,(err, submittedcart)=>{
        if (err) throw err;
        res.send(submittedcart)
    })
})
const auth=(req, res, next)=>{
    const tkt = req.query.tkt;
    const d = new Date()
    let time = d.getTime()
 //   const indexer = parseInt(tkt.split("kbop")[0].length + parseInt(tkt.split("kbop")[0]))
    const indexermain = tkt.split("bkop")[1]
    const nayv = req.query.nayv;
    conn.query('select * from customers where customerId=? and print =?',[indexermain,nayv], (err, existing_user)=>{
        if (err) throw err;
        if (existing_user && existing_user.length > 0){
         res.json({status:"success"})
         }else{
            res.json({status:"failed", message :"unauthorized"})
         }
         next()
    })
}
const authwithnext=(req, res, next)=>{
    const tkt = req.query.tkt;
    const d = new Date()
    let time = d.getTime()
 //   const indexer = parseInt(tkt.split("kbop")[0].length + parseInt(tkt.split("kbop")[0]))
    const indexermain = tkt.split("bkop")[1]
    const nayv = req.query.nayv;
    conn.query('select * from customers where customerId=? and print =?',[indexermain,nayv], (err, existing_user)=>{
        if (err) throw err;
        if (existing_user && existing_user.length > 0){
            next()
         }else{
            res.json({status:"failed", message :"unauthorized"})
         }
         
    })
}
router.get(`/auth_user`,auth, (req, res)=>{

})
router.get(`/fetch_saveditems`, (req, res)=>{
    const tkt = req.query.tkt;
    if(tkt){
    const indexermain = parseInt(tkt.split("bkop")[1])   
    if(indexermain){
   conn.query(`select * from savedProducts inner join product on (savedProducts.savedproduct_productId = product.productId) where savedproduct_customerId =? order by savedproduct_time desc;
  `,[indexermain], (err, savedItems)=>{
    if (err) throw err;
        res.json({status:"success",savedItems:savedItems})
   })
    }else{
        res.json({status:"failed",message:"unauthorized"})
    }
}else{
    res.json({status:"failed", message:"unauthorized"})
}
})
const fetch_gp_submitted_cart =`select *,Count(*) as numofcart, CONCAT('₦',FORMAT(SUM(submittedcart.total),0)) as invoicetotal,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
CONCAT('₦', FORMAT(submittedcart.quantity*product.sellingprice, 0)) as total 
 from submittedcart inner join product on (product.productId = submittedcart.sub_productId)
 inner join stores s on (s.storeId= submittedcart.sub_storeId)
 inner join dispatch d on (d.dispatchId= submittedcart.sub_dispatchId)
  where submittedcart.sub_customerId = ? group by submittedcart.invoiceNo order by submittedcart.timesubmitted desc`
const fetch_submitted_cart =`select *,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
CONCAT('₦', FORMAT(submittedcart.quantity*product.sellingprice, 0)) as total 
 from submittedcart inner join product on (product.productId = submittedcart.sub_productId)
 inner join stores s on (s.storeId= submittedcart.sub_storeId)
 inner join dispatch d on (d.dispatchId= submittedcart.sub_dispatchId)
  where submittedcart.sub_customerId = ? and submittedcart.invoiceNo=? order by submittedcart.timesubmitted desc`
  const fetch_shoppingcart = `select *,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
                CONCAT('₦', FORMAT(shoppingcart.quantity*product.sellingprice, 0)) as total 
                from shoppingcart inner join product on (product.productId = shoppingcart.shop_productId) 
                inner join stores s on (s.storeId = shoppingcart.shop_storeId)
                inner join dispatch d on (d.dispatchId = shoppingcart.shop_dispatchId)
                where shop_customerId = ? order by  time_added desc;`
 const fetch_cartreciepts =` select *,Count(*) as noofcartreciepts,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
 CONCAT('₦', FORMAT(submittedcart.quantity*product.sellingprice, 0)) as total 
  from submittedcart inner join product on (product.productId = submittedcart.sub_productId)
   inner join (select * from stores) s on (s.storeId = submittedcart.sub_storeId)
   inner join dispatch d on (d.dispatchId = submittedcart.sub_dispatchId)
   inner join customers client on (client.customerId=submittedcart.sub_customerId)
   where s.store_customerId = ? group by submittedcart.invoiceNo
 order by submittedcart.timesubmitted desc;`
 const fetch_cartreciepts_bycustomerId =` select *,Count(*) as noofcartreciepts,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
 CONCAT('₦', FORMAT(submittedcart.quantity*product.sellingprice, 0)) as total 
  from submittedcart inner join product on (product.productId = submittedcart.sub_productId)
   inner join (select * from stores) s on (s.storeId = submittedcart.sub_storeId)
   inner join dispatch d on (d.dispatchId = submittedcart.sub_dispatchId)
   inner join customers client on (client.customerId=submittedcart.sub_customerId)
   where s.store_customerId = ? group by submittedcart.sub_customerId
 order by submittedcart.timesubmitted desc;`
 const fetch_cartreciepts_bydispatch = ` select *,Count(*) as noofcartreciepts,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
 CONCAT('₦', FORMAT(submittedcart.quantity*product.sellingprice, 0)) as total 
  from submittedcart inner join product on (product.productId = submittedcart.sub_productId)
   inner join (select * from stores) s on (s.storeId = submittedcart.sub_storeId)
   inner join dispatch d on (d.dispatchId = submittedcart.sub_dispatchId)
   inner join customers client on (client.customerId=submittedcart.sub_customerId)
   where s.store_customerId = ? group by submittedcart.sub_dispatchId
 order by submittedcart.timesubmitted desc;`
 const fetch_dispatchreciepts = `select *,Count(*) as noofdispatchreciepts,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
 CONCAT('₦', FORMAT(submittedcart.quantity*product.sellingprice, 0)) as total,SUM(sub_dispatchfee) as totaldispatch
  from submittedcart inner join product on (product.productId = submittedcart.sub_productId)
   inner join (select * from stores) s on (s.storeId = submittedcart.sub_storeId)
   inner join (select * from dispatch) d on (d.dispatchId = submittedcart.sub_dispatchId)
   inner join customers client on (client.customerId=submittedcart.sub_customerId)
   where d.dispatch_customerId = ? group by submittedcart.invoiceNo
 order by submittedcart.timesubmitted desc;`
 const fetch_dispatchreciepts_bycustomerId = `select *,Count(*) as noofdispatchreciepts,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
 CONCAT('₦', FORMAT(submittedcart.quantity*product.sellingprice, 0)) as total,SUM(sub_dispatchfee) as totaldispatch
  from submittedcart inner join product on (product.productId = submittedcart.sub_productId)
   inner join (select * from stores) s on (s.storeId = submittedcart.sub_storeId)
   inner join (select * from dispatch) d on (d.dispatchId = submittedcart.sub_dispatchId)
   inner join customers client on (client.customerId=submittedcart.sub_customerId)
   where d.dispatch_customerId = ? group by submittedcart.sub_customerId
 order by submittedcart.timesubmitted desc;`
 const fetch_dispatchreciepts_bystore = `select *,Count(*) as noofdispatchreciepts,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
 CONCAT('₦', FORMAT(submittedcart.quantity*product.sellingprice, 0)) as total,SUM(sub_dispatchfee) as totaldispatch
  from submittedcart inner join product on (product.productId = submittedcart.sub_productId)
   inner join (select * from stores) s on (s.storeId = submittedcart.sub_storeId)
   inner join (select * from dispatch) d on (d.dispatchId = submittedcart.sub_dispatchId)
   inner join customers client on (client.customerId=submittedcart.sub_customerId)
   where d.dispatch_customerId = ? group by submittedcart.sub_storeId
 order by submittedcart.timesubmitted desc;`
 const fetch_ungroupedcartreciepts_bycustomerId= `select *,Count(*) as noofdispatchreciepts,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
 CONCAT('₦', FORMAT(submittedcart.quantity*product.sellingprice, 0)) as total,SUM(sub_dispatchfee) as totaldispatch
  from submittedcart inner join product on (product.productId = submittedcart.sub_productId)
   inner join (select * from stores) s on (s.storeId = submittedcart.sub_storeId)
   inner join (select * from dispatch) d on (d.dispatchId = submittedcart.sub_dispatchId)
   inner join customers client on (client.customerId=submittedcart.sub_customerId)
   where s.store_customerId = ? and submittedcart.sub_customerId=? group by submittedcart.subcartId
 order by submittedcart.timesubmitted desc;`
 const fetch_ungroupedcartreciepts_bydispatchId= `select *,Count(*) as noofdispatchreciepts,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
 CONCAT('₦', FORMAT(submittedcart.quantity*product.sellingprice, 0)) as total,SUM(sub_dispatchfee) as totaldispatch
  from submittedcart inner join product on (product.productId = submittedcart.sub_productId)
   inner join (select * from stores) s on (s.storeId = submittedcart.sub_storeId)
   inner join (select * from dispatch) d on (d.dispatchId = submittedcart.sub_dispatchId)
   inner join customers client on (client.customerId=submittedcart.sub_customerId)
   where s.store_customerId = ? and submittedcart.sub_dispatchId=? group by submittedcart.subcartId
 order by submittedcart.timesubmitted desc;`
 const fetch_ungroupedcartreciepts_byinvoice= `select *,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
 CONCAT('₦', FORMAT(submittedcart.quantity*product.sellingprice, 0)) as total,SUM(sub_dispatchfee) as totaldispatch
  from submittedcart inner join product on (product.productId = submittedcart.sub_productId)
   inner join (select * from stores) s on (s.storeId = submittedcart.sub_storeId)
   inner join (select * from dispatch) d on (d.dispatchId = submittedcart.sub_dispatchId)
   inner join customers client on (client.customerId=submittedcart.sub_customerId)
   where s.store_customerId = ? and submittedcart.invoiceNo=? group by submittedcart.subcartId
 order by submittedcart.timesubmitted desc;`
 //fetch_ungroupeddispatchreciepts_byinvoice
 const fetch_ungroupeddispatchreciepts_bycustomerId= `select *,Count(*) as noofdispatchreciepts,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
 CONCAT('₦', FORMAT(submittedcart.quantity*product.sellingprice, 0)) as total,SUM(sub_dispatchfee) as totaldispatch
  from submittedcart inner join product on (product.productId = submittedcart.sub_productId)
   inner join (select * from stores) s on (s.storeId = submittedcart.sub_storeId)
   inner join (select * from dispatch) d on (d.dispatchId = submittedcart.sub_dispatchId)
   inner join customers client on (client.customerId=submittedcart.sub_customerId)
   where d.dispatch_customerId = ? and submittedcart.sub_customerId=? group by submittedcart.subcartId
 order by submittedcart.timesubmitted desc;`
 const fetch_ungroupeddispatchreciepts_bystoreId= `select *,Count(*) as noofdispatchreciepts,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
 CONCAT('₦', FORMAT(submittedcart.quantity*product.sellingprice, 0)) as total,SUM(sub_dispatchfee) as totaldispatch
  from submittedcart inner join product on (product.productId = submittedcart.sub_productId)
   inner join (select * from stores) s on (s.storeId = submittedcart.sub_storeId)
   inner join (select * from dispatch) d on (d.dispatchId = submittedcart.sub_dispatchId)
   inner join customers client on (client.customerId=submittedcart.sub_customerId)
   where d.dispatch_customerId = ? and submittedcart.sub_storeId=? group by submittedcart.subcartId
 order by submittedcart.timesubmitted desc;`
 const fetch_ungroupeddispatchreciepts_byinvoice= `select *,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
 CONCAT('₦', FORMAT(submittedcart.quantity*product.sellingprice, 0)) as total,CONCAT('₦',FORMAT(sub_dispatchfee, 0)) as totaldispatch
  from submittedcart inner join product on (product.productId = submittedcart.sub_productId)
   inner join (select * from stores) s on (s.storeId = submittedcart.sub_storeId)
   inner join (select * from dispatch) d on (d.dispatchId = submittedcart.sub_dispatchId)
   inner join customers client on (client.customerId=submittedcart.sub_customerId)
   where d.dispatch_customerId = ? and submittedcart.invoiceNo=? group by sub_productId
 order by submittedcart.timesubmitted desc;`
 const fetch_mydispatch_orders=`select * from dispatch_hire h inner join dispatch d on
  (d.dispatchId=h.hire_dispatchId) inner join customers c on (c.customerId = h.hire_customerId) where h.hire_dispatchId = ?;`
router.get(`/fetch_userdetails`, (req, res)=>{
    const tkt = req.query.tkt;
    if(tkt){
    const indexermain = parseInt(tkt.split("bkop")[1])   
    if(indexermain){
   conn.query(`select * from customers inner join (select count(*) as nosaved from savedProducts where savedproduct_customerId =?) as mainnosaved inner join (select count(*) as noshoppingcart from shoppingcart where shop_customerId =?) as mainnoshoppingcart where customerId =?;`,[indexermain,indexermain,indexermain], (err, userdetails)=>{
    if (err) throw err;
    conn.query(`select * from savedProducts inner join product on (savedProducts.savedproduct_productId = product.productId) where savedproduct_customerId =? order by savedproduct_time desc;
    ${fetch_gp_submitted_cart};
   ${fetch_shoppingcart}
    ${fetch_cartreciepts}
    ${fetch_dispatchreciepts}
    select * from stores s left join storerating sr on (s.storeId = sr.storerating_storeId) left join (select storerating_storeId,avg(storerating) as averagerating from storerating) as storeratingalias on (storeratingalias.storerating_storeId = sr.storerating_storeId) where s.store_customerId=? group by s.store_name;
   select * from dispatch d left join dispatchrating dr on (d.dispatchId = dr.dispatchrating_dispatchId) left join (select dispatchrating_dispatchId,avg(dispatchrating) as averagerating from dispatchrating) as dispatchratingalias on (d.dispatchId=dispatchratingalias.dispatchrating_dispatchId) where d.dispatch_customerId=? group by d.dispatch_name;
   ${fetch_mydispatch_orders}
   select FORMAT(SUM(quantity*shop_sellingprice+shop_dispatchfee),2) as sumtotal, SUM(shop_dispatchfee) as totaldispatchfee ,SUM(quantity*shop_sellingprice) as sumtotalmain from shoppingcart where shop_customerId =? group by shop_customerId
    `, [indexermain,indexermain,indexermain, indexermain, indexermain, indexermain, indexermain, indexermain, indexermain], (err, userItems)=>{
        if (err) throw err;
        res.json({status:"success",userdetails:userdetails,savedItems:userItems[0], submittedcart:userItems[1], shoppingcart:userItems[2],cartreciepts:userItems[3], dispatchreciepts:userItems[4], registeredstores:userItems[5], registereddispatch:userItems[6], dispatchhires:userItems[7], shoppingcart_sumtotal:userItems[8]})
    })
   })
    }else{
        res.json({status:"failed",message:"unauthorized"})
    }
}else{
    res.json({status:"failed", message:"unauthorized"})
}
})
router.get(`/fetch_client`, (req, res)=>{
    const indexermain = req.query.clientId;
    if(indexermain){
   conn.query(`select * from customers left join 
   stores on (customers.customerId = stores.store_customerId) inner join
   (select count(*) as nosaved from savedProducts where savedproduct_customerId =?) as mainnosaved inner join 
   (select count(*) as noshoppingcart from shoppingcart where shop_customerId =?) as mainnoshoppingcart where customerId =?;
   select * from stores s left join storerating sr on (s.storeId = sr.storerating_storeId) left join (select storerating_storeId,avg(storerating) as averagerating from storerating) as storeratingalias on (storeratingalias.storerating_storeId = sr.storerating_storeId) where s.store_customerId=? group by s.store_name;
   select * from dispatch d left join dispatchrating dr on (d.dispatchId = dr.dispatchrating_dispatchId) left join (select dispatchrating_dispatchId,avg(dispatchrating) as averagerating from dispatchrating) as dispatchratingalias on (d.dispatchId=dispatchratingalias.dispatchrating_dispatchId) where d.dispatch_customerId=? group by d.dispatch_name`,[indexermain,indexermain,indexermain,indexermain,indexermain], (err, clientdetails)=>{
    if (err) throw err;
        res.json({status:"success",clientdetails:clientdetails[0],clientstore:clientdetails[1],clientdispatch:clientdetails[2]})
    })
    }else{
        res.json({status:"failed",message:"unauthorized"})
    }
})
router.post("/edit_profile",upload.single("files"), (req,res)=>{
   const profileinputs = JSON.parse(req.body.inputs)
 //  console.log(JSON.parse(profileinputs.inputs), JSON.parse(profileinputs.inputs).name)
 if(req.query.file){
     cloudinary.v2.uploader.upload(
    req.file.path,
    {folder: "chatapp/profilepicture"},
    (error,result)=>{
        if (error) throw err;
        const image = `${result.original_filename}.${result.original_extension}`
   conn.query(`update customers set name=?, gender=?, contact=?,address=? where email =?`, 
   [image,profileinputs.name, profileinputs.gender, profileinputs.contact,profileinputs.address, profileinputs.email],(err, updated)=>{
    if (err) throw err;
    console.log("updated done and dusted")
    if( updated) res.json({status:"success"})
    else res.json({status:"failed"})
   })
    }
)
 }else{
    console.log(profileinputs)
    conn.query(`update customers set name=?,gender=?, contact=?,address=? where email=?`, 
   [profileinputs.name,profileinputs.gender, profileinputs.contact,profileinputs.address,profileinputs.email],(err, updated)=>{
    if (err) throw err;
    console.log("updated done and dusted",updated)
    if( updated) res.json({status:"success"})
    else res.json({status:"failed"})
})
 }
})
router.post(`/register_dispatch`, upload.array("files"), (req,res)=>{
    const datainputs = JSON.parse(req.body.inputs)
     const userdetails = JSON.parse(req.body.userdetails)
     const code = Math.floor((Math.random()*Math.random())*10000000000)        
     const uploader = async (path) => await cloudinaries.uploads(path,`./chatapp/profilepicture`);
     const urls = []
     const mainImages ={}
     const files = req.files || req.file
     for(var i=0; i < files.length; i++){
         const {path} = files[i]
         const newPath =   uploader(path)
         urls.push(newPath)   
         fs.unlinkSync(path)
         mainImages[i+1] = files[i].filename
         } 
         console.log("lat&lng", req.body.lat, req.body.lng, mainImages, datainputs)
         res.json({status:"success", message:`[ACTION REQUIRED] an email has been sent to ${datainputs.store_email}, kindly proceed to confirm your email`})
    //    conn.query(`insert into dispatch (dispatch_customerId,dispatch_email,dispatch_contact,dispatch_name,dispatch_about, dispatch_address,dispatch_lga, dispatch_state,dispatchreg_time,dispatchconfirmationCode ,dispatch_images,dispatchlat, dispatchlng) values (?,?,?,?,?,?,?,?,?,?,?,?,?)`, 
    //    [userdetails.customerId,datainputs.dispatch_email,datainputs.dispatch_contact,datainputs.dispatch_name,datainputs.dispatch_about, datainputs.dispatch_address, datainputs.dispatch_lga,datainputs.dispatch_state, Date.now(),code, JSON.stringify(mainImages),req.body.lat, req.body.lng],(err, updated)=>{
    //     if (err) throw err;
    //     console.log("updated done and dusted")
    //     if( updated){
    //       res.json({status:"success",message:"an email has been sent to you"})
    //      }
    //     else {
    //      res.json({status:"failed", message:"sorry, an errror occured while processing this request"})
    //   }
    //    })     
     
 })
router.post(`/register_store`, upload.array("files"), (req,res)=>{
   const datainputs = JSON.parse(req.body.inputs)
    const userdetails = JSON.parse(req.body.userdetails)
    const code = Math.floor((Math.random()*Math.random())*10000000000)
    const uploader = (path) => cloudinaries.uploads(path,`/store`);
    const urls = []
    const mainImages ={}
    console.log("req.files", req.files)
    const files = req.files || req.file
    for(var i=0; i < files.length; i++){
        const {path} = files[i]
        const newPath = uploader(path)
        urls.push(newPath)   
        fs.unlinkSync(path)
        mainImages[i+1] = files[i].filename
        } 
 console.log("mainImages",datainputs)
      conn.query(`insert into stores (store_customerId,store_firstname,store_lastname,store_name,store_about, store_address,store_lga, store_state,storereg_time,storeconfirmationCode ,store_images,storelat, storelng ) values (?,?,?,?,?,?,?,?,?,?,?,?,?)`, 
      [userdetails.customerId,datainputs.firstname,datainputs.lastname,datainputs.businessname,datainputs.aboutbusiness, datainputs.businessaddress, datainputs.lga,datainputs.state, Date.now(),code, JSON.stringify(mainImages), req.body.lat, req.body.lng],(err, updated)=>{
       if (err) throw err;
       console.log("updated done and dusted")
       if(updated){
         res.json({status:"success",message:"an email has been sent to you"})
        }
       else {
        res.json({status:"failed", message:"sorry, an error occured while processing this request"})
     }
      })     
    
})
router.get(`/follow_store`,(req,res)=>{
    const tkt = req.query.tkt;
     if(tkt){
     const indexermain = parseInt(tkt.split("bkop")[1])    
     conn.query(`select stores_following from customers where customerId =?;
     select * from stores where store_name=?`,[indexermain, req.query.store],
     (err, data)=>{
        if (err) throw err;
        let prevstoresfollowing = data[0][0] && data[0][0].stores_following ? JSON.parse(data[0][0].stores_following) : []
        let prevfollowers = data[1][0] && data[1][0].store_followers ? JSON.parse(data[1][0].store_followers) : []
        prevstoresfollowing.unshift(data[1][0].storeId)
        prevfollowers.unshift(indexermain)
        prevstoresfollowing =JSON.stringify(prevstoresfollowing)
        prevfollowers= JSON.stringify(prevfollowers)
        conn.query(`update customers set stores_following =? where customerId=?;
        update stores set store_followers =? where store_name=?`,
        [prevstoresfollowing,indexermain,prevfollowers, req.query.store], (err, updated)=>{
            if( err) throw err;
            if(updated){
                res.json({status:"success", message:"followers and following updated successfully"})
            }else{
                res.json({status:"failed",message:"please try again after a few mins,an error occured "})
            }
        })
     })
     }
})
router.get(`/unfollow_store`,(req,res)=>{
    const tkt = req.query.tkt;
     if(tkt){
     const indexermain = parseInt(tkt.split("bkop")[1])    
     conn.query(`select stores_following from customers where customerId =?;
     select * from stores where store_name=?`,[indexermain, req.query.store],
     (err, data)=>{
        if (err) throw err;
        console.log("indexermain", indexermain, req.query.store)
        let prevstoresfollowing = data[0][0] && JSON.parse(data[0][0].stores_following)
        let prevfollowers = data[1][0] && JSON.parse(data[1][0].store_followers)
        prevstoresfollowing.splice(prevstoresfollowing.indexOf(data[1][0].storeId),1)
        prevfollowers.splice(prevfollowers.indexOf(indexermain), 1)
        prevstoresfollowing =JSON.stringify(prevstoresfollowing)
        prevfollowers= JSON.stringify(prevfollowers)
        console.log("data after splicing", prevstoresfollowing, prevfollowers)
        conn.query(`update customers set stores_following =? where customerId=?;
        update stores set store_followers =? where store_name=?`,
        [prevstoresfollowing,indexermain,prevfollowers, req.query.store], (err, updated)=>{
            if( err) throw err;
            if(updated){
                res.json({status:"success", message:"followers and following updated successfully"})
            }else{
                res.json({status:"failed",message:"please try again after a few mins,an error occured "})
            }
        })
     })
     }
})
router.get(`/follow_dispatch`,(req,res)=>{
    const tkt = req.query.tkt;
     if(tkt){
     const indexermain = parseInt(tkt.split("bkop")[1])    
     conn.query(`select dispatch_following from customers where customerId =?;
     select * from dispatch where dispatchId=?`,[indexermain, req.query.dispatchId],
     (err, data)=>{
        if (err) throw err;
        let prevdispatchfollowing = data[0][0] && data[0][0].dispatch_following ? JSON.parse(data[0][0].dispatch_following) : []
        let prevfollowers = data[1][0] && data[1][0].dispatch_followers ? JSON.parse(data[1][0].dispatch_followers) : []
        prevdispatchfollowing.unshift(data[1][0].dispatchId)
        prevfollowers.unshift(indexermain)
        prevdispatchfollowing =JSON.stringify(prevdispatchfollowing)
        prevfollowers= JSON.stringify(prevfollowers)
        conn.query(`update customers set dispatch_following =? where customerId=?;
        update dispatch set dispatch_followers =? where dispatchId=?`,
        [prevdispatchfollowing,indexermain,prevfollowers, req.query.dispatchId], (err, updated)=>{
            if( err) throw err;
            if(updated){
                res.json({status:"success", message:"followers and following updated successfully"})
            }else{
                res.json({status:"failed",message:"please try again after a few mins,an error occured "})
            }
        })
     })
     }
})
router.get(`/unfollow_dispatch`,(req,res)=>{
    const tkt = req.query.tkt;
     if(tkt){
     const indexermain = parseInt(tkt.split("bkop")[1])    
     conn.query(`select dispatch_following from customers where customerId =?;
     select * from dispatch where dispatchId=?`,[indexermain, req.query.dispatchId],
     (err, data)=>{
        if (err) throw err;
        console.log("indexermain", indexermain, req.query.store)
        let prevdispatchfollowing = data[0][0] && JSON.parse(data[0][0].dispatch_following)
        let prevfollowers = data[1][0] && JSON.parse(data[1][0].dispatch_followers)
        prevdispatchfollowing.splice(prevdispatchfollowing.indexOf(data[1][0].storeId),1)
        prevfollowers.splice(prevfollowers.indexOf(indexermain), 1)
        prevdispatchfollowing =JSON.stringify(prevdispatchfollowing)
        prevfollowers= JSON.stringify(prevfollowers)
        console.log("data after splicing", prevdispatchfollowing, prevfollowers)
        conn.query(`update customers set dispatch_following =? where customerId=?;
        update dispatch set dispatch_followers =? where dispatchId=?`,
        [prevdispatchfollowing,indexermain,prevfollowers, req.query.dispatchId], (err, updated)=>{
            if( err) throw err;
            if(updated){
                res.json({status:"success", message:"followers and following updated successfully"})
            }else{
                res.json({status:"failed",message:"please try again after a few mins,an error occured "})
            }
        })
     })
     }
})

router.get(`/addtocart`,authwithnext,(req,res)=>{
    const tkt = req.query.tkt;
   // const io = req.app.get('socketio')  itemratingsize
   const d = new Date()
   const time = d.getTime()
    if(tkt){
    const indexermain = parseInt(tkt.split("bkop")[1])    
    const productId = req.query.productId
   conn.query(`select * from customers where customerId=?`, [indexermain], (err, customerdetails)=>{
    if (err) throw err;
    if(customerdetails.length > 0){
        conn.query(`select * from dispatch order by abs(dispatchlat-${customerdetails[0].customerlat}) asc,abs(dispatchlng-${customerdetails[0].customerlng}) asc limit 1;
        select * from dispatch where dispatch_type=? or dispatch_type=? order by abs(dispatchlat-${customerdetails[0].customerlat}) asc,abs(dispatchlng-${customerdetails[0].customerlng}) asc limit 1`, ["vehicle", "hybrid"],(err, availabledispatch)=>{
      if(err) throw err;
    conn.query(`select * from product p inner join stores s on (s.store_name = p.product_store) where p.productId =?`, [productId], (err, stock)=>{
    if (err) throw err;
if(stock){
    const getregdistance = async()=>{
        return await (getDistanceFromLatLonInKm(customerdetails[0].customerlat, customerdetails[0].customerlng, stock[0].storelat, stock[0].storelng).toFixed(3) > 0 ? getDistanceFromLatLonInKm(customerdetails[0].customerlat, customerdetails[0].customerlng, stock[0].storelat, stock[0].storelng).toFixed(3) : 0.3);
      }
      let dispatchindex=stock[0].itemsize_index/20;
      let itemsize =stock[0].itemsize
      let itemratingsize=stock[0].itemsize_index
    
   if(dispatchindex !== 0 && itemratingsize !== 0){
    getregdistance().then(distance =>{
        if(distance === 0){
            distance = 0.3
        }
        console.log("distance", distance)
        if(!distance){
            res.json({status:"failed",message:"could not compute dispatch, try again in few minutes"})
        }else{
    if (stock[0].stock && stock[0].stock > 0){
        conn.query(`select *, SUM(shop_itemsize_index) as productsize from shoppingcart where shop_customerId =? and shop_storeId=? and shop_productId=? group by shop_storeId;`,[indexermain,stock[0].storeId,productId],(err, existing_cart)=>{
    if (err) throw err;
    if(existing_cart && existing_cart.length > 0){
         dispatchindex = dispatchindex*0.5
        let dispatchfee = dispatchindex*distance*2000
        if(dispatchfee === 0){
            dispatchfee = 250;
        }

        conn.query(`update shoppingcart set quantity=?, time_updated=?,shop_dispatchfee=(select shop_dispatchfee)+?, shop_itemsize_index=(select shop_itemsize_index)+? where shop_customerId=? and shop_storeId=? and shop_productId=?`,
        [ parseInt(existing_cart[0].quantity) + 1,time,dispatchfee,itemratingsize,indexermain,stock[0].storeId,productId], (err, updated)=>{
            if (err) throw err
            if (!updated){
                res.json({status:'failed',message:"an error occured, try again after a few minutes"})
            }else if(updated.affectedRows === 0){
                res.json({status:'failed',message:"couldnt add item, kindly try again after a few minutes"})
            }
            else{ conn.query(`${fetch_shoppingcart}
            select * from customers inner join (select count(*) as nosaved from savedProducts where savedproduct_customerId =?) as mainnosaved inner join (select count(*) as noshoppingcart from shoppingcart where shop_customerId =?) as mainnoshoppingcart where customerId =?;
            update product set stock= stock-1 where productId =?;
            select *, SUM(shop_itemsize_index) as item_index from shoppingcart where shop_storeId=? and shop_customerId =? group by shop_customerId, shop_storeId`,
            [indexermain,indexermain,indexermain,indexermain, productId,stock[0].storeId,customerdetails[0].customerId], (err, data)=>{
                if (err) throw err;
                const all_index = data[3][0].item_index
                console.log("all prev index", all_index)
                if(all_index && all_index >= 20){
                  conn.query(`update shoppingcart set shop_dispatch_type=?,shop_dispatchId =?, shop_dispatch=? where shop_storeId=? and shop_customerId =?`,
                   ["vehicle",availabledispatch[1][0].dispatchId, availabledispatch[1][0].dispatch_name,stock[0].storeId,customerdetails[0].customerId], (err, dispatchupdated)=>{
                     if(err) throw err;
                     if(dispatchupdated && dispatchupdated.affectedRows > 0){
                     console.log("dispatch updated and changed if neccessary")
                     }
                  })
                }
                res.json({status:"success", message:`quantity updated successfully`,shoppingcart:data[0], userdetails:data[1]})
                })
            }
        })
        
    }else{ conn.query(`select *, SUM(shop_itemsize_index) as item_index from shoppingcart where shop_customerId =? and shop_storeId=?`,[indexermain,stock[0].storeId],(err, existing_cart_from_store)=>{
            if (err) throw err;
            if(existing_cart_from_store && existing_cart_from_store.length > 0 && existing_cart_from_store[0].shoppingcartId !== null){
             dispatchindex = dispatchindex*0.7
            let dispatchfee = dispatchindex*distance*1700
        
            const dispatch_type = parseInt(stock[0].itemsize_index) + parseInt(existing_cart_from_store[0].item_index)  >= 20 ? "vehicle" : "motorcycle"
            console.log("dispatchfee from added a new product but store already exist",dispatch_type)

               conn.query(`insert into shoppingcart (shop_productId, shop_customerId, quantity, shop_status,time_added,time_notified,shop_store, shop_storeId, shop_dispatchId, shop_dispatch,
                 shop_itemsize, shop_sellingprice, shop_distance, shop_dispatchfee,shop_invoiceNo, shop_itemsize_index, shop_dispatch_type) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);
        insert into history (id,history_customerId,title,subject,history_message,historytime, cleartime) values (?,?,?,?,?,?,?);`,
        [productId, indexermain, 1, "pending",time, time,stock[0].product_store,stock[0].storeId, availabledispatch[0][0].dispatchId,availabledispatch[0][0].dispatch_name,
        stock[0].itemsize,stock[0].sellingprice,distance,dispatchfee, existing_cart_from_store[0].shop_invoiceNo,stock[0].itemsize_index, dispatch_type ,productId,indexermain,"shoppingcart",
     "item added to shoppingcart","you recently added an item to shopping cart",time,time,time, time], (err, inserted)=>{
            if (err) throw err;
          if (!inserted[0]){
            res.json({status:'failed',message:"an error occured, try again after a few minutes"})
          }else if(!inserted[0].affectedRows === 0){
            res.json({status:'failed',message:"couldnt add item, kindly rry again after a few minutes"})
          }
          else{ 
            if(dispatch_type === "vehicle"){
            conn.query(`update shoppingcart set shop_dispatch_type =?, shop_dispatchId=?, shop_dispatch=? where shop_customerId =? and shop_storeId =?`,
             [dispatch_type,availabledispatch[1][0].dispatchId, availabledispatch[1][0].dispatch_name, customerdetails[0].customerId, stock[0].storeId], (err, updated_dispatchtype)=>{
                if(updated_dispatchtype){
            conn.query(`${fetch_shoppingcart}
            select * from customers inner join (select count(*) as nosaved from savedProducts where savedproduct_customerId =?) as mainnosaved inner join (select count(*) as noshoppingcart from shoppingcart where shop_customerId =?) as mainnoshoppingcart where customerId =?;
            update product set stock= stock-1 where productId =?;`,
            [indexermain,indexermain,indexermain,indexermain,productId], (err, data)=>{
                if (err) throw err;
            res.json({status:"success", message:`${stock[0].details} added to cart`,shoppingcart:data[0], userdetails:data[1]})
            })                
        }
    })
}
        }         
        })
        }else{
            console.log("completetly a new store")
            let dispatchfee = dispatchindex*distance*1700
            const randOne = Math.floor(Math.random()*10000)
            const randTwo = Math.floor(Math.random()*1000)
            const randThree = Math.floor(Math.random()*10000)
            const invoiceNo = randOne*randTwo*randThree
            const dispatch_type = stock[0].itemsize_index >= 20 ? "vehicle" : "motorcycle"
            console.log("dispatchfee added from new product without store existing at all",dispatchindex, distance, dispatchfee)
            conn.query(`insert into shoppingcart (shop_productId, shop_customerId, quantity, shop_status,time_added,time_notified,shop_store, shop_storeId, shop_dispatchId, shop_dispatch,
                shop_itemsize, shop_sellingprice, shop_distance, shop_dispatchfee,shop_invoiceNo, shop_itemsize_index, shop_dispatch_type) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);
                insert into history (id,history_customerId,title,subject,history_message,historytime, cleartime) values (?,?,?,?,?,?,?);`,
                [productId, indexermain, 1, "pending",time, time,stock[0].product_store,stock[0].storeId, availabledispatch[0][0].dispatchId,availabledispatch[0][0].dispatch_name,
                stock[0].itemsize,stock[0].sellingprice,distance,dispatchfee, invoiceNo, stock[0].itemsize_index, dispatch_type ,productId,indexermain,"shoppingcart",
             "item added to shoppingcart","you recently added an item to shopping cart",time,time,time, time], (err, inserted)=>{
                    if (err) throw err;
                    if (!inserted[0]){
                    res.json({status:'failed',message:"an error occured, try again after a few minutes"})
                  }else if(!inserted[0].affectedRows === 0){
                    res.json({status:'failed',message:"couldnt add item, kindly rry again after a few minutes"})
                  }
                  else{ 
                    conn.query(`${fetch_shoppingcart}
                    select * from customers inner join (select count(*) as nosaved from savedProducts where savedproduct_customerId =?) as mainnosaved inner join (select count(*) as noshoppingcart from shoppingcart where shop_customerId =?) as mainnoshoppingcart where customerId =?;
                    update product set stock= stock-1 where productId =?;`,
                    [indexermain,indexermain,indexermain,indexermain,productId], (err, data)=>{
                        if (err) throw err;
                    res.json({status:"success", message:`${stock[0].details} added to cart`,shoppingcart:data[0], userdetails:data[1]})
                    })
                }         
                })
        }
    })
    }
 
   })
}else{
    res.json({status:"failed", message:"opps! this item is out of stock"})
  }        
}
})

}else{
    res.json({status:"failed", message:"opps! could not access item size, kindly try again in few minutes"})
}
// })
}
    
})  })
}
}) 
}else{
        res.json({status:"failed", message:"unauthorized"})
    }
})
router.get("/rate",authwithnext, (req,res)=>{
    const tkt = req.query.tkt;
    if(tkt){
    const indexermain = parseInt(tkt.split("bkop")[1]) 
    const productId = req.query.productId
    const comment= JSON.parse(req.query.ratingsinput).mycomment
    const rating = JSON.parse(req.query.ratingsinput).myrating
    const d = new Date()
    const now = d.getTime()
    conn.query(`select * from productrating where productId =? and customerId=?;
    select productrating from product where productId =?`,[productId, indexermain,productId],(err, already_rated)=>{
        if(err) throw err;
        if(already_rated[0].length > 0){
            res.json({status:"failed",message:"you can only comment once, kindly go through our faqs to learn more about our policy"})
        }else{
            let newproductrating;
      if(already_rated[1] && already_rated[1][0] && already_rated[1][0].productrating !== null ){
       newproductrating =  parseInt(already_rated[1][0].productrating) + parseInt(rating)  
       newproductrating = newproductrating/2
       console.log("already_rated is not 0", newproductrating)
      }else{
       newproductrating = rating;
       console.log("already_rated is 0", newproductrating)
      }
    conn.query(`Insert into productrating (customerId,productId,maincomment,mainrating,commenttime,commentdate) VALUES (?,?,?,?,?,?);
    update product set rating =(select rating)+?, numofrating=(select numofrating) + 1, productrating=? where productId=?;
    insert into history (id,history_customerId,title,subject,history_message,historytime, cleartime) values (?,?,?,?,?,?,?);`,
    [indexermain,productId,comment,rating,now,now, parseInt(rating)/100,newproductrating,productId,
        productId,indexermain,"rating","rating added successfully",
        "you recently rated an item",now, now],(err, inserted)=>{
        if(err) throw err;
        if(inserted){
conn.query(`select * from productrating inner join customers on (productrating.customerId =customers.customerId) where productrating.productId=? order by productrating.productratingId desc;
select avg(mainrating) as avgrating from productrating where productId =?;`
 ,[productId,productId], (err, product)=>{
            if (err) throw err;    
            res.json({status:"success", comments:product[0],avgrating:product[1] })
        })
        }else{
            res.json({status:"failed",message:"sorry an error occured while adding your comments"})
        }
    })

}
})
}else{
    res.json({status:"failed", message:"not a registered user"})
}
})
router.get(`/delete_saveditems`, (req,res)=>{
    const tkt = req.query.tkt;
    const d = new Date()
    const time = d.getTime()
    const indexermain = tkt.split("bkop")[1]
    console.log("savedId",req.query.savedId)
   conn.query(`delete from savedproducts where savedProductId =? and savedproduct_customerId =?`,[req.query.savedId,indexermain],(err, deleted)=>{
        if (err) throw err;
        if(!deleted){
            res.json({status:"failed", message:"an error occured, kindly try again after a few moments"})
        }
        else if(deleted.affectedRows === 0){
            res.json({status:"failed", message:"couldn't remove item from repository, try again later"})
        }
        else if(deleted){
 conn.query(`select * from savedproducts inner join customers on (customers.customerId=savedproducts.savedproduct_customerId) inner join product on (product.productId=savedproducts.savedproduct_productId)  where savedproducts.savedproduct_customerId =? order by savedProducts.savedProductId desc;
 insert into history (id,history_customerId,title,subject,history_message,historytime, cleartime) values (?,?,?,?,?,?,?);`,
 [indexermain,"",indexermain, "saved","item deleted from repository", "you recently deleted an item from your repository",time, time],(err, savedItems)=>{
                if (err) throw err;
                if (savedItems[0]){
                    res.json({status:"success", message:`Item removed from repository`, savedproducts:savedItems[0]})
                }else{
                    res.json({status:"failed", message:"an error occured, please try again after a few minutes"})
                }
            }) 
        }else{
            res.json({status:"failed", message:"an error occured"})
        }
    }) 
           
})
router.get(`/fetch_saveditems`, (req,res)=>{
    const tkt = req.query.tkt;
    const d = new Date()
    let time = d.getTime()
 //   const indexer = parseInt(tkt.split("kbop")[0].length + parseInt(tkt.split("kbop")[0]))
    const indexermain = tkt.split("bkop")[1]
    console.log("indexermain",indexermain)
   conn.query(`select * from savedproducts inner join customers on (customers.customerId=savedproducts.savedproduct_customerId) inner join product on (product.productId=savedproducts.savedproduct_productId)  where savedproducts.savedproduct_customerId =? order by savedProducts.savedProductId desc`,[indexermain],(err, savedItems)=>{
        if (err) throw err;
        if (savedItems.length > 0){
        console.log("fetching saved")
            res.json({status:"success", savedproducts:savedItems})
        }else{
            res.json({status:"failed", message:"an error occured"})
        }
    }) 
           
})
router.get("/fetch_shoppingcart", (req,res)=>{
    const tkt = req.query.tkt;
    const indexermain = parseInt(tkt.split("bkop")[1])
    const d = new Date()
    let time = d.getTime()
    if(tkt && indexermain && !isNaN(indexermain)){
    conn.query(`${fetch_shoppingcart}
     select FORMAT(SUM(quantity*shop_sellingprice),2) as sumtotal, SUM(shop_dispatchfee) as totaldispatchfee ,FORMAT(SUM(quantity*shop_sellingprice+shop_dispatchfee),2) as sumtotalmain from shoppingcart where shoppingcart.shop_customerId =? group by shop_customerId`, [indexermain,indexermain], (err, shoppingcart)=>{
        if(err) throw err;
        res.json({status:"success",shoppingcart:shoppingcart[0],shoppingcart_sumtotal:shoppingcart[1]})
    })
}else{
    res.json({status:"failed",message:'unauthorized'})
}
})
router.get("/fetch_groupedshoppingcart", (req,res)=>{
    const tkt = req.query.tkt;
    const indexermain = parseInt(tkt.split("bkop")[1])
    const d = new Date()
    let time = d.getTime()
    if(tkt && indexermain && !isNaN(indexermain)){
    conn.query(`select *,count(*) as counter,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
     CONCAT('₦', FORMAT(SUM(shoppingcart.quantity*product.sellingprice), 0)) as total 
     from shoppingcart inner join product on (product.productId = shoppingcart.shop_productId) 
     where shop_customerId = ? group by shoppingcart.shop_store,shoppingcart.shop_dispatch order by time_added desc;
     select FORMAT(SUM(quantity*shop_sellingprice+shop_dispatchfee),2) as sumtotal, SUM(shop_dispatchfee) as totaldispatchfee ,SUM(quantity*shop_sellingprice) as sumtotalmain from shoppingcart where shop_customerId =? group by shop_customerId;`, [indexermain,indexermain], (err, shoppingcart)=>{
        if(err) throw err;
        res.json({status:"success",shoppingcart:shoppingcart[0],shoppingcart_sumtotal:shoppingcart[1]})
    })
}else{
    res.json({status:"failed",message:'unauthorized'})
}
})
router.get("/updatequantity", (req,res)=>{
    const tkt = req.query.tkt;
    const indexermain = parseInt(tkt.split("bkop")[1])
    conn.query(`select * from shoppingcart where shoppingcartId=?`, [req.query.shoppingcartId], (err, cartdetails)=>{
        if (err) throw err;
    conn.query(`select * from shoppingcart inner join customers c on (c.customerId=shoppingcart.shop_customerId) inner join product p on (p.productId = shoppingcart.shop_productId) where shoppingcart.shoppingcartId =?;
    select SUM(shop_itemsize_index) as item_index from shoppingcart where shop_customerId=? and shop_storeId=?`,[req.query.shoppingcartId, indexermain, cartdetails[0].shop_storeId], (err, prevquantity)=>{
        if (err) throw err;
        let distance = prevquantity[0][0].shop_distance;
        let itemsize = prevquantity[0][0].shop_itemsize;
        let productindex = prevquantity[0][0].itemsize_index;
        let prevtotalindex = prevquantity[1][0].item_index
        let newindex =productindex; 
        let calc_dispatchfee = distance*(productindex/20)*2000*0.5

        console.log("calculated fee", calc_dispatchfee)
              
        const newdispatchfee = req.query.action === "increase" ? parseInt(prevquantity[0][0].shop_dispatchfee) + parseInt(calc_dispatchfee) : parseInt(prevquantity[0][0].shop_dispatchfee) - parseInt(calc_dispatchfee)
        let newquantity = req.query.action === "increase" ? prevquantity[0][0].quantity + 1 : prevquantity[0][0].quantity -1
        if(newquantity === 0){
           return res.json({status:"failed", message:"Quantity Cannot go below 1 Unit"})
        }
        console.log("prevtotalindex",prevtotalindex, productindex)
        if(req.query.action === "decrease"){
            newindex = (prevquantity[0][0].quantity -1)*productindex
            prevtotalindex = parseInt(prevtotalindex) - parseInt(productindex)
            conn.query(`update product set stock=stock + 1 where productId =?`, [req.query.productId],(err, updateproducts)=>{
                if (err) throw err;
                console.log("stock increased")
            })
        }else{
            newindex = (prevquantity[0][0].quantity +1)*productindex
            prevtotalindex = parseInt(prevtotalindex) + parseInt(productindex);
            conn.query(`update product set stock=stock - 1 where productId =?`, [req.query.productId],(err, updateproducts)=>{
                if (err) throw err;
                console.log("stock decreased")
            }) 
        }
        newquantity = newquantity === 0 ? 1 : newquantity
     if(prevtotalindex >= 20){
        conn.query(`select * from dispatch where dispatch_type=? or dispatch_type=? order by abs(dispatchlat-${prevquantity[0][0].customerlat}) asc,abs(dispatchlng-${prevquantity[0][0].customerlng}) asc limit 1`, ["vehicle", "hybrid"],(err, availabledispatch)=>{
      if(err) throw err;
        conn.query(`update shoppingcart set shop_dispatch_type =?, shop_dispatch=?, shop_dispatchId=?  where shop_customerId=? and shop_storeId =?`, ["vehicle",availabledispatch[0].dispatch_name, availabledispatch[0].dispatchId, prevquantity[0][0].shop_customerId, prevquantity[0][0].shop_storeId], (err, dispatchupdated)=>{
    if (err) throw err;
    if(dispatchupdated && dispatchupdated.affectedRows){
        console.log("updated successfully set above 20")
    }
        })
    })
     }else  if(prevtotalindex <= 19){
        conn.query(`select * from dispatch order by abs(dispatchlat-${prevquantity[0][0].customerlat}) asc,abs(dispatchlng-${prevquantity[0][0].customerlng}) asc limit 1`,(err, availabledispatch)=>{
            if(err) throw err;
            console.log("less than 20", availabledispatch[0].dispatch_name)
              conn.query(`update shoppingcart set shop_dispatch_type =?, shop_dispatch=?, shop_dispatchId=?  where shop_customerId=? and shop_storeId =?`, ["motorcycle",availabledispatch[0].dispatch_name, availabledispatch[0].dispatchId, prevquantity[0][0].shop_customerId, prevquantity[0][0].shop_storeId], (err, dispatchupdated)=>{
          if (err) throw err;
          if(dispatchupdated && dispatchupdated.affectedRows){
              console.log("updated successfully set below 20")
          }
              })
          })
     }
     conn.query(`update shoppingcart set quantity = ?,shop_dispatchfee =?,time_updated=?, shop_itemsize_index=? where shoppingcartId =?`,[newquantity,newdispatchfee,Date.now(),newindex,req.query.shoppingcartId], (err, updated)=>{
        if (err) throw err;    
     if(updated && updated.affectedRows > 0){
        conn.query(`${fetch_shoppingcart}
        select FORMAT(SUM(quantity*shop_sellingprice),2) as sumtotal, SUM(shop_dispatchfee) as totaldispatchfee ,FORMAT(SUM(quantity*shop_sellingprice+shop_dispatchfee),2) as sumtotalmain from shoppingcart where shoppingcart.shop_customerId =? group by shop_customerId`,
         [indexermain,indexermain], (err, shoppingcart)=>{
           if(err) throw err;
           res.json({status:"success", message:`cart quantity updated successfully`,shoppingcart:shoppingcart[0],shoppingcart_sumtotal:shoppingcart[1]})
        })
     }else {
        res.json({status:"failed", message:"An error occured, couldnt update quantity"})
     }
     })
    })       
})
})
router.get("/deletecart",(req,res)=>{
    if(req.query.tkt){
        const tkt = req.query.tkt;
        const d = new Date()
        const time = d.getTime()
    const indexermain = parseInt(tkt.split("bkop")[1])
    conn.query(`select * from shoppingcart s inner join customers c on (c.customerId =s.shop_customerId) where s.shoppingcartId=? `,[req.query.shoppingcartId],(err, shopcart)=>{
        if (err) throw err;
    conn.query(`update product set stock=(select stock) + ? where productId =?;
    delete from shoppingcart where shoppingcartId = ?;
    select SUM(shop_itemsize_index) as item_index from shoppingcart where shop_customerId=? and shop_storeId=?`,
    [shopcart[0].quantity,shopcart[0].shop_productId,req.query.shoppingcartId, shopcart[0].shop_customerId, shopcart[0].shop_storeId],(err, deleted)=>{
        if (err) throw err;
        if(deleted[2] && deleted[2][0] && deleted[2][0].item_index < 20 ){
            conn.query(`select * from dispatch order by abs(dispatchlat-${shopcart[0].customerlat}) asc,abs(dispatchlng-${shopcart[0].customerlng}) asc limit 1`,(err, availabledispatch)=>{
                if(err) throw err;
                console.log("less than 20", availabledispatch[0].dispatch_name)
                  conn.query(`update shoppingcart set shop_dispatch_type =?, shop_dispatch=?, shop_dispatchId=?  where shop_customerId=? and shop_storeId =?`, ["motorcycle",availabledispatch[0].dispatch_name, availabledispatch[0].dispatchId, shopcart[0].shop_customerId, shopcart[0].shop_storeId], (err, dispatchupdated)=>{
              if (err) throw err;
              if(dispatchupdated && dispatchupdated.affectedRows){
                  console.log("updated successfully set below 20")
              }
                  })
              })
        }
        if(deleted[0] && deleted[1] && deleted[2]){
            conn.query(`${fetch_shoppingcart}
            select FORMAT(SUM(quantity*shop_sellingprice+shop_dispatchfee),2) as sumtotal, SUM(shop_dispatchfee) as totaldispatchfee ,SUM(quantity*shop_sellingprice) as sumtotalmain from shoppingcart where shop_customerId =? group by shop_customerId;
            insert into history (id,history_customerId,title,subject,history_message,historytime, cleartime) values (?,?,?,?,?,?,?);`,
             [indexermain,indexermain,shopcart[0].shop_productId,indexermain,"shoppingcart","item removed from shoppingcart",
             "you recently deleted an item from shoppingcart",time, time], (err, shoppingcart)=>{
               if(err) throw err;
               res.json({status:"success",shoppingcart:shoppingcart[0],shoppingcart_sumtotal:shoppingcart[1]})
            })
         }
    })
})
    } 
})
router.get(`/submit_cart`, (req, res)=>{
    if(req.query.tkt && req.query.paymenttype){
        const tkt = req.query.tkt;
        const paymenttype = req.query.paymenttype
    const indexermain = parseInt(tkt.split("bkop")[1])
    const d = new Date()
    const currentTime = d.getTime()
    const deliveryTime = d.getTime()+86400000
    const sumtotalmain = req.query.sumtotalmain
 
     conn.query(`select * from customers where customerId =?;
     select *,product.productId as pid, CONCAT('₦', FORMAT(sellingprice,2)) as amount,
     CONCAT('₦', FORMAT(SUM(shoppingcart.quantity*product.sellingprice), 2)) as total
      from shoppingcart inner join stores s on (s.storeId = shoppingcart.shop_storeId)
      inner join dispatch d on (d.dispatchId = shoppingcart.shop_dispatchId)
       inner join product on (product.productId = shoppingcart.shop_productId)  where shoppingcart.shop_customerId = ? group by shoppingcart.shop_store;

      select *,product.productId as pid, CONCAT('₦', FORMAT(sellingprice,2)) as amount,
     CONCAT('₦', FORMAT(SUM(shop_dispatchfee), 2)) as total
      from shoppingcart inner join stores s on (s.storeId = shoppingcart.shop_storeId)
      inner join dispatch d on (d.dispatchId = shoppingcart.shop_dispatchId)
      inner join product on (product.productId = shoppingcart.shop_productId)  where shoppingcart.shop_customerId = ? group by shoppingcart.shop_dispatch;
      select FORMAT(SUM(shoppingcart.quantity*product.sellingprice),2) as sumtotal from product inner join shoppingcart on (product.productId = shoppingcart.shop_productId) where shoppingcart.shop_customerId =?`,
       [indexermain,indexermain,indexermain,indexermain], (err, customer)=>{
        if (err) throw err;
        // ,sub_dispatchfee, sub_itemsize, sub_distance,sumtotal,sub_paymenttype,sub_itemsize_index, sub_dispatch_type 
        // ,shop_dispatchfee, shop_itemsize,shop_distance,${sumtotalmain},"${paymenttype}",shop_itemsize_index,shop_dispatch_type
        if(customer[0] && customer[0][0].email){
                conn.query(`insert into submittedcart (invoiceNo,sub_productId,sub_customerId,quantity,timecarted,timesubmitted,deliverytime,cartstatus,store_cartstatus,
                    sub_storeId, sub_store, sub_dispatchId, sub_dispatch,total,sub_dispatchfee, sub_itemsize,sumtotal, sub_distance,sub_paymenttype,sub_itemsize_index, sub_dispatch_type )
                select shop_invoiceNo,shoppingcart.shop_productId,${indexermain},shoppingcart.quantity,shoppingcart.time_added,${currentTime},${deliveryTime},"pending","pending",
                shop_storeId, shop_store, shop_dispatchId, shop_dispatch,(product.sellingprice*shoppingcart.quantity),shop_dispatchfee, shop_itemsize, "${sumtotalmain}",shop_distance,"${paymenttype}",shop_itemsize_index,shop_dispatch_type from shoppingcart inner join product on (product.productId = shoppingcart.shop_productId) where shoppingcart.shop_customerId = ? `,[indexermain], (err, inserted)=>{
                if (err) throw err;
                if(inserted){
                    conn.query(`delete from shoppingcart where shop_customerId =?`, [indexermain], (err, updated)=>{
                        if (err) throw err;
               if(updated){
                conn.query(`${fetch_shoppingcart}
                select FORMAT(SUM(shoppingcart.quantity*product.sellingprice),2) as sumtotal from product inner join shoppingcart on (product.productId = shoppingcart.shop_productId) where shoppingcart.shop_customerId =?;
                insert into history (history_customerId,title, subject,history_message,historytime,cleartime)
                 values (?,?,?,?,?,?)`,
                 [indexermain,indexermain, indexermain,"shoppingcart","shoppingcart submitted successfully", "we have successfully received your order",currentTime, currentTime], (err, shoppingcart)=>{
                   if(err) throw err;
                   const mailOptions ={
                    from :`"Eoeze 'n' sons merchandize" limited @<yexies4ogb@gmail.com>`,
                    to:customer[0][0].email,
                    subject:`Order Received Successfully 15/12/2022`,
                    attachments: [{
                      filename: 'fruget.jpg',
                      path: __dirname+'/fruget.jpg',
                      cid: 'unique@fruget.ee'
                  }],
                    html:`<p style="margin-left:10px">Hi, <b>${customer[0][0].name}</b></p>
                  <div style="padding:10px">
                    <div style="border:1px solid grey;padding:10px;width:100%">
                     <center>Cart Details</center>
                     <hr/>
                     <p style="padding:2px;margin:0px">Customer Name: ${customer[0][0].name}</p>
                     <p style="padding:2px;margin:0px">Contact: ${customer[0][0].contact}</p>
                     <p style="padding:2px;margin:0px">Address: ${customer[0][0].address}</p>
                     <p style="padding:2px;margin:0px">Amount Due: <b>${customer[2][0].sumtotal}</b> </p>
                     <p style="padding:2px;margin:0px">Time Due: 15/12/2022</p>
      
                     <small style="color:indianred">*Please Note that this is excluding delivery charges</small>
                    </div>
                    </div>
                    <div style="padding:20px">
                      <img src="cid:unique@fruget.ee" style="width:100%" />
                    <center><p>This is to confirm that an order was placed by you and we have recieved your requests successfully.</p>
                    <p>We have already initiated the process to ensure you recieve the item within the stipulated time as we are very 
                     keep to time and our word.</p>
                    </center>
                    <div>
                    <p>Kindly find below the a list of all the items you ordered and the amount due.</p>
                    <div>
                     <ol>
                     ${customer[1].map(customers=>
                  `<li>
                  <div>
                  <b>Item : </b> ${customers.details}<br/>
                  <b>Item Code : </b> 01000${customers.pid}<br/>
                  <b>Color : </b> ${customers.color} <br/>
                  <b>Price : </b> ${customers.amount} <br/>
                  <b>Quantity :</b> ${customers.quantity}<br/>
                  <b>total : </b> ${customers.total} <br/>
                  </div>
                  </li>`
                     )}
                     </ol>
                     <br/>
                    <br/><br/>
                     <small>if You didnt make this order kindly click here</small>
                    </div>
                    </div>
                    <div>
                    `
                  }
                  transporter.sendMail(mailOptions, (err,info)=>{
                      if (err) throw err;
                      if(customer[1] && customer[1].length > 0){
                        customer[1].map(cust =>{
                            const storemailOptions ={
                                from :`"Fruget[You Have recieved An Order]" @${d} @<yexies4ogb@gmail.com>`,
                                to:cust.store_email,
                                subject:`[${cust.store_name}] Have recieved An Order @${cust.shop_invoiceNo}`,
                                attachments: [{
                                  filename: 'fruget.jpg',
                                  path: __dirname+'/fruget.jpg',
                                  cid: 'unique@fruget.ee'
                              }],
                                html:` <div>
                                <p>Hi ${cust.store_name}, </p>
                                <p>${customer[0][0].name} has placed an order for your product</p>
                                <center>
                                    <p style="font-size: 30px;margin-bottom:0px">You have just recieved an order</p>
                                <small>Feb 18, 08:28pm </small><br/>
                                <small style="font-size:20px">${cust.total}</small><br/><br/>
                                               
                                <div style="margin-top: 50px">
                                    <button style="background-color: orange;color:white;font-size:18px;border:none;padding: 20px 40px;border-radius: 5px">
                                        Open Order
                                    </button>
                                    <br/><br/>
                                    <small>kindly click <a href="">here</a> to view our steps and policies for all stores and registered dispatches</small>
                                    </center>
                                <div class="footer" style="background-color: rgba(245,245,245,0.7);margin-top:40px;margin-bottom:50px;padding: 0">
                            <div style="padding:25px 10px;border-top: 1px solid lightgrey;border-bottom: 1px solid lightgrey;color:lightgrey">
                                    <small>This email is intended for Eze Ogbonnaya, @ no 30 owode street iwaya yaba lagos state and cannot be replied to but kindly disregard if you are not the above mentioned contact</small>
                            </div>
                            </div>
                            <div style="color:indianred;padding: 20px;width:100%;">
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
                                console.log(`email sent to stores ${cust.store_name}`)
                            })
                           
                        }) 
                       }
                       if(customer[2] && customer[2].length > 0){
                        customer[2].map(cust =>{
                            const storemailOptions ={
                                from :`"Fruget[You Have recieved An Order]" @${d} @<yexies4ogb@gmail.com>`,
                                to:cust.dispatch_email,
                                subject:`[${cust.dispatch_name}] You Have recieved An Order @${cust.shop_invoiceNo}`,
                                attachments: [{
                                  filename: 'fruget.jpg',
                                  path: __dirname+'/fruget.jpg',
                                  cid: 'unique@fruget.ee'
                              }],
                                html:` <div>
                                <p>Hi ${cust.dispatch_name}, </p>
                                <p>${customer[0][0].name} has placed an order for your services</p>
                                <center>
                                    <p style="font-size: 30px;margin-bottom:0px">You have just recieved an order</p>
                                <small>Feb 18, 08:28pm </small><br/>
                                <small style="font-size:20px">${cust.total}</small><br/><br/>
                                               
                                <div style="margin-top: 50px">
                                    <button style="background-color: orange;color:white;font-size:18px;border:none;padding: 20px 40px;border-radius: 5px">
                                        Open Order
                                    </button>
                                    <br/><br/>
                                    <small>kindly click <a href="">here</a> to view our steps and policies for all stores and registered dispatches</small>
                                    </center>
                                <div class="footer" style="background-color: rgba(245,245,245,0.7);margin-top:40px;margin-bottom:50px;padding: 0">
                            <div style="padding:25px 10px;border-top: 1px solid lightgrey;border-bottom: 1px solid lightgrey;color:lightgrey">
                                    <small>This email is intended for Eze Ogbonnaya, @ no 30 owode street iwaya yaba lagos state and cannot be replied to but kindly disregard if you are not the above mentioned contact</small>
                            </div>
                            </div>
                            <div style="color:indianred;padding: 20px;width:100%;">
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
                                console.log(`email sent to dispatches ${cust.dispatch_name}` )
                            })
                           
                        }) 
                       }
                   res.json({status:"success", message:`Order with invoice ${invoiceNumber} has been sent successfully`,shoppingcart:shoppingcart[0],shoppingcart_sumtotal:shoppingcart[1]})
              })
                })
               }
                    })
                }  
            })
        }else{
            res.json({status:"failed", message:"Couldnt Find User"})
        }
        })
    } 
    })
router.get(`/fetch_submitted_cart`, (req, res)=>{
    const tkt = req.query.tkt;
    const indexermain = parseInt(tkt.split("bkop")[1])
    conn.query(`${fetch_gp_submitted_cart}`,[indexermain],(err, submittedcart)=>{
        if (err) throw err;
        console.log("submittedcart",submittedcart.length)
        res.json({status:"success", submittedcart:submittedcart})
    })
})
router.get(`/fetch_invoice_cart`, (req, res)=>{
    const tkt = req.query.tkt;
    const indexermain = parseInt(tkt.split("bkop")[1])
    conn.query(`${fetch_submitted_cart}`,[indexermain, req.query.invoiceNo],(err, invoicecart)=>{
        if (err) throw err;
        res.json({status:"success", invoicecart:invoicecart})
    })
})
router.get(`/fetch_cartreciepts`, (req, res)=>{
    const tkt = req.query.tkt;
    const indexermain = parseInt(tkt.split("bkop")[1])
    if(req.query.order === "invoice"){
    conn.query(`${fetch_cartreciepts}`,[indexermain],(err, cartreciepts)=>{
        if (err) throw err;
        res.json({status:"success", cartreciepts:cartreciepts})
    })
}else if(req.query.order === "customer"){
    conn.query(`${fetch_cartreciepts_bycustomerId}`,[indexermain],(err, cartreciepts)=>{
        if (err) throw err;
        console.log("cartreciepts",cartreciepts.length)
        res.json({status:"success", cartreciepts:cartreciepts})
    })
}else if(req.query.order === "dispatch"){
    conn.query(`${fetch_cartreciepts_bydispatch}`,[indexermain],(err, cartreciepts)=>{
        if (err) throw err;
        console.log("cartreciepts",cartreciepts.length)
        res.json({status:"success", cartreciepts:cartreciepts})
    })
}else{
    res.json({status:"success", cartreciepts:[]})
}
})
router.get(`/fetch_dispatchreciepts`, (req, res)=>{
    const tkt = req.query.tkt;
    const order = req.query.order
    const indexermain = parseInt(tkt.split("bkop")[1])
  if(order === "invoice"){
    conn.query(`${fetch_dispatchreciepts}`,[indexermain],(err, dispatchreciepts)=>{
        if (err) throw err;
        console.log("dispatchreciepts",dispatchreciepts.length)
        res.json({status:"success", dispatchreciepts:dispatchreciepts})
    })
  }else if(order === "customer"){
    conn.query(`${fetch_dispatchreciepts_bycustomerId}`,[indexermain],(err, dispatchreciepts)=>{
        if (err) throw err;
        console.log("dispatchreciepts by cust",dispatchreciepts.length)
        res.json({status:"success", dispatchreciepts:dispatchreciepts})
    })
  }else{
    conn.query(`${fetch_dispatchreciepts_bystore}`,[indexermain],(err, dispatchreciepts)=>{
        if (err) throw err;
        console.log("dispatchreciepts bys store",dispatchreciepts.length)
        res.json({status:"success", dispatchreciepts:dispatchreciepts})
    })
  }
})
// fetch_ungroupedcartreciepts_byinvoice
//fetch_ungroupeddispatchreciepts
router.get(`/fetch_ungroupedcartreciepts`, (req, res)=>{
    const invoiceNo = req.query.invoiceNo
    const customerId = req.query.customerId
    const dispatchId= req.query.dispatchId
    const tkt = req.query.tkt;
    const order = req.query.order
    const indexermain = parseInt(tkt.split("bkop")[1])
    if(order === "invoice"){
        conn.query(`${fetch_ungroupedcartreciepts_byinvoice}`,[indexermain,invoiceNo],(err, ungroupedcartreciepts)=>{
            if (err) throw err;
            console.log("ungrouped dispatchreciept by invoice",invoiceNo,ungroupedcartreciepts.length)
            res.json({status:"success", ungroupedcartreciepts:ungroupedcartreciepts})
        })
    }else  if(order === "customer"){
        conn.query(`${fetch_ungroupedcartreciepts_bycustomerId}`,[indexermain,customerId],(err, ungroupedcartreciepts)=>{
            if (err) throw err;
            console.log("ungrouped dispatchreciept by customer",ungroupedcartreciepts.length)
            res.json({status:"success", ungroupedcartreciepts:ungroupedcartreciepts})
        })
    }else  if(order === "dispatch"){
        conn.query(`${fetch_ungroupedcartreciepts_bydispatchId}`,[indexermain,dispatchId],(err, ungroupedcartreciepts)=>{
            if (err) throw err;
            console.log("ungrouped dispatchreciept by dispatch",ungroupedcartreciepts.length)
            res.json({status:"success", ungroupedcartreciepts:ungroupedcartreciepts})
        })
    }

})
router.get(`/fetch_ungroupeddispatchreciepts`, (req, res)=>{
    const invoiceNo = req.query.invoiceNo
    const customerId = req.query.customerId
    const storeId= req.query.storeId
    const tkt = req.query.tkt;
    const order = req.query.order
    const indexermain = parseInt(tkt.split("bkop")[1])
    if(order === "invoice"){
        conn.query(`${fetch_ungroupeddispatchreciepts_byinvoice}`,[indexermain,invoiceNo],(err, ungroupeddispatchreciepts)=>{
            if (err) throw err;
            console.log("ungrouped cartreciept by invoice",invoiceNo,ungroupeddispatchreciepts.length)
            res.json({status:"success", ungroupeddispatchreciepts:ungroupeddispatchreciepts})
        })
    }else  if(order === "customer"){
        conn.query(`${fetch_ungroupeddispatchreciepts_bycustomerId}`,[indexermain,customerId],(err, ungroupeddispatchreciepts)=>{
            if (err) throw err;
            console.log("ungrouped cartreciept by customer",ungroupeddispatchreciepts.length)
            res.json({status:"success", ungroupeddispatchreciepts:ungroupeddispatchreciepts})
        })
    }else  if(order === "store"){
        conn.query(`${fetch_ungroupeddispatchreciepts_bystoreId}`,[indexermain,storeId],(err, ungroupeddispatchreciepts)=>{
            if (err) throw err;
            console.log("ungrouped cartreciept by dispatch",ungroupeddispatchreciepts.length)
            res.json({status:"success", ungroupeddispatchreciepts:ungroupeddispatchreciepts})
        })
    }

})
router.get(`/clear_singleorder`,(req,res)=>{
    const invoiceNo =req.query.invoiceNo
    const d = new Date()
    let time = d.getTime()
    const randomOne = Math.floor(Math.random()*10000)
    const randomTwo = Math.floor(Math.random()*10000)
    const randomThree = Math.floor(Math.random()*10000)
    const randomFour = Math.floor(Math.random()*10000)
    const randomNo = (randomOne*randomTwo*randomThree*randomFour)
    console.log("random length", randomNo)
    const tkt = req.query.tkt;
    const pid= req.query.productId
    const indexermain = parseInt(tkt.split("bkop")[1])
    if(indexermain){
        conn.query(`select * from customers where customerId=?`,[indexermain],(err, customer)=>{
            if(err) throw err;
            if(customer && customer[0].email){
      conn.query(`select *,Count(*) as numofcart,SUM(total) as invoicetotal,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
      CONCAT('₦', FORMAT(submittedcart.quantity*product.sellingprice, 0)) as total 
       from submittedcart inner join product on (product.productId = submittedcart.sub_productId)
        where submittedcart.sub_customerId = ? and submittedcart.invoiceNo=? group by submittedcart.invoiceNo;
       update submittedcart set confirmId =? where invoiceNo =? and sub_customerId=? `,[indexermain,invoiceNo,randomNo,invoiceNo, indexermain],(err,cart)=>{
        if (err) throw err;
        if(cart[0] && cart[1]){
    const otherrandomNo = Math.floor(Math.random()*100000000000000)
    const alphabets="abcdefghisbssbsohgkgigmglmolpfmgnkbmiknjhbyvfcddwzzaqqwedcfrtgyhbbnjnmkmlkopoijjsnbsgafdgffarartdvdbdidogkgpglumomhvarekfndbsfvwrcsghsbsfadareacaeqfqvwvxh"
    const alphapos =Math.floor(Math.random()*100)
    const slicedalpha = alphabets.slice(0,alphapos)

    const mailOptions={
        from:`Fruget[Action Required] <yexies4ogb@gmail.com>`,
        to: customer[0].email,
        subject:'Confirm Order Recieved',
        attachments: [{
            filename: 'fruget.jpg',
            path: __dirname+'/fruget.jpg',
            cid: 'unique@fruget.ee'
        },
   { path: `https://res.cloudinary.com/fruget-com/image/upload/${cart[0][0].generalcategory}/${cart[0][0].category}/${cart[0][0].mainimg}`,
    cid: `unique@cartimage.ee`}],
        html:`
       <div>
       <p style="margin-left:5px">Hi, <b>${customer[0].name}</b></p>
          <center>
          <small>This is to confirm that you recieved the following product or products in a top-notch condition</small>
          <br/>
          <p>Kindly Click the button below to confirm you are the one closing this order</p>
          </center>
         <div style="padding:3px>
         <div>
      <ol>
      ${cart[0].map(carts=>
        `<li>
        <div style="display:flex;flex-wrap:nowrap">
        <div style="width:50%;padding:0px">
        <img src="cid:unique@cartimage.ee" style="width:100%"  />
        </div>
        <div style="width:80%">
        <p style="margin-bottom:0px">
        ${carts.details}
        <br/>
        <br/>
        <a href="http://localhost:3000/profile/submittedcart/${cart.invoiceNo}">View More</a>
        </p>
        ${carts.numofcart > 1 ? ` + ${carts.numofcart - 1} others`
      : ""}
        </div>
        <br/><br/>
       <div style="width:80%;padding:0px 8px">
        <small>
       <p style="font-size:18px"><b>Invoice : </b> ${carts.invoiceNo}</p>
       <p style="font-size:18px"><b>Item Count : </b> ${carts.numofcart}</p>
       <p style="font-size:18px"><b>total : </b> ${carts.invoicetotal} </p>
       </small>
       </div>
        </div>
        </li>`           
         )}
      </ol>
       <br/>
       <a href="http://localhost:3000/profile/submitted_cart?confirmorder=${randomNo}${otherrandomNo}${slicedalpha}&tkt=${tkt.split("bkop")[0]}&pid=${pid}&skb=${invoiceNo}">
       <button style="background-color: orange;color:white;border:none;padding: 10px 20px;font-size:18px;border-radius: 5px">
       confirm order
   </button>
         </a>
         <br/><br/>
         </div>
         </div>
          <small style="color:grey">If link fails open copy and past the url below in any browser of your choice</small><br/><br/>
          <small><a href="http://localhost:3000/profile/submitted_cart?confirmorder=${randomNo}${otherrandomNo}${slicedalpha}&tkt=${tkt.split("bkop")[0]}&pid=${pid}&skb=${invoiceNo}">http://localhost:3000/submitted_cart?confirmorder=${randomNo}/${otherrandomNo}${slicedalpha}&tkt=${tkt.split("bkop")[0]}&pid=${pid}&skb=${invoiceNo}</a></small>
          </center>
          <br/><br/>
          <div class="footer" style="background-color: rgba(245,245,245,0.7);color:grey;margin-top:40px;margin-bottom:50px;padding: 0">
	<div style="padding:25px 10px;border-top: 1px solid lightgrey;border-bottom: 1px solid lightgrey;color:lightgrey">
			<small>This email is autogenerated and intended for ${customer[0].name}, @ ${customer[0].address} and cannot be replied to but kindly disregard if you are not the above mentioned contact</small>
	</div>
	</div>
          <small style="color:grey">
          Note : * If you did not initiate this process kindly click on the button below
          </small><br/><br/>
          <button style="box-shadow:none;background-color:none;color:indianred;border:none;padding: 3px 20px;font-size:18px;border-radius: 5px">
          not me
      </button>
          <br/><br/>
          <div style="color:indianred;padding: 20px;width:100%;">
		<center>
		<small>Contact: <b>08169319476/ 07031974963</b></small><br/>
		<small>@ fruget services limited, Address : No 1, coaste street oyingbo- ebutte meta</small><br/>
		<small>Lagos Mainland</small>
		<small>Lagos state, Nigeria.</small>
	</center>
	</div>
          <img src="cid:unique@fruget.ee" style="width:50%" />
       </div>`
    }
    transporter.sendMail(mailOptions,(err, info)=>{
        if (err) throw err
        if(info){
        conn.query(`update submittedcart set cartstatus=? where invoiceNo=?`,["request sent",invoiceNo], (err, updated)=>{
      if(err) throw err;
            res.json({status:"success", message:`a confirmation mail has been sent to ${customer[0].email}`})
        })
        }else{
            res.json({status:'failed', message:"An Error Occured"})
        }
    })
}
})
      }
  })
}
})
router.get(`/fetch_verified_sales`, (req, res)=>{
    const tkt = req.query.tkt;
    const indexermain = parseInt(tkt.split("bkop")[1])
    if(tkt && indexermain && !isNaN(indexermain)){
 conn.query(`select * from completed_purchase inner join product on (completed_purchase.completedpurchase_productId = product.productId) 
 where completed_purchase.completedpurchase_customerId =?`,[indexermain], (err, completed_purchase)=>{
    if (err) throw err
    if( completed_purchase){
        res.json({status:"success", completed_purchase})
    }else{
        res.json({status:"failed", message:"an error occured"})
    }
 })
}
})
router.get(`/confirm_rateorder`, (req,res)=>{
    const confirmId = req.query.confirmId
    const mainconfirmId = confirmId.slice(0,14)
    const invoiceNo = req.query.invoiceNo
    const pid= req.query.pid
    const tkt = req.query.tkt;
    const indexermain = parseInt(tkt.split("bkop")[1])
    conn.query(`select * from submittedcart inner join (select productId,details from product) as productdetails
     on (productdetails.productId = submittedcart.sub_productId) where
      confirmId=? and invoiceNo=? and sub_customerId=? group by sub_storeId;
      select * from submittedcart inner join (select productId,details from product) as productdetails
     on (productdetails.productId = submittedcart.sub_productId) where
      confirmId=? and invoiceNo=? and sub_customerId=? group by sub_dispatchId`,[mainconfirmId, invoiceNo, indexermain,mainconfirmId, invoiceNo, indexermain], (err, clearinvoice)=>{
        if (err) throw err;
        if(clearinvoice[0].length > 0 && clearinvoice[1].length > 0){
            console.log("clearinvoice",mainconfirmId, clearinvoice[0].length)
        res.json({status:"success", clearinvoice:{store:clearinvoice[0], dispatch:clearinvoice[1]}})
        }else{
            res.json({status:"failed"})
        }
    })
})
router.get(`/confirm_clearorder`,(req,res)=>{
    console.log("hello clear order")
    const confirmId = req.query.confirmId
    const mainconfirmId = confirmId.slice(0,14)
    // const subcartId = req.query.skb
    const d=new Date
    const pid= req.query.pid
    const tkt = req.query.tkt;
    const invoiceNo = req.query.invoiceNo
    const storeratings = JSON.parse(req.query.storeratings)
    const dispatchratings = JSON.parse(req.query.dispatchratings)
    const storeId = req.query.storeId
    const dispatchId = req.query.dispatchId
    const indexermain = parseInt(tkt.split("bkop")[1])
    console.log(dispatchId, storeId, storeratings.mycomment, storeratings.myrating)
    if(mainconfirmId && invoiceNo){ 
        conn.query(`insert into completed_purchase (subcartId, completedpurchase_invoiceNo, completedpurchase_customerId, completedpurchase_confirmId, completedpurchase_productId, completedpurchase_quantity, completedpurchase_total,
             completedpurchase_sumtotal, completedpurchase_timecarted, completedpurchase_timesubmitted, completedpurchase_deliverytime, completedpurchase_cartstatus, completedpurchase_cleartime, completedpurchase_storeId, completedpurchase_store, completedpurchase_dispatchId, completedpurchase_dispatch)
        select subcartId, invoiceNo, sub_customerId, confirmId, sub_productId, quantity, total,sumtotal, timecarted, timesubmitted, deliverytime,cartstatus,${Date.now()},sub_storeId, sub_store, sub_dispatchId, sub_dispatch from submittedcart where invoiceNo=? ;
        update product p set product_verifiedsales=(select product_verifiedsales) + (select quantity from submittedcart where sub_productId=p.productId) ,product_verifiedsales_time=?  where p.productId IN (select sub_productId from submittedcart where invoiceNo = ?);
        update stores set store_verifiedsales=(select store_verifiedsales) + 1, store_verifiedsales_time=? where storeId IN (select sub_storeId from submittedcart where invoiceNo = ?);
        update dispatch set dispatch_verifieddispatch=(select dispatch_verifieddispatch) + 1, dispatch_verifieddispatch_time=? where dispatchId IN (select sub_dispatchId from submittedcart where invoiceNo = ?);
        insert into storerating (storerating_storeId,storerating_customerId,storerating,storecomment,storerating_time) values (?,?,?,?,?);
        insert into dispatchrating (dispatchrating_dispatchId,dispatchrating_customerId,dispatchrating,dispatchcomment,dispatchrating_time)
        values (?,?,?,?,?);`, [invoiceNo, Date.now(),invoiceNo,Date.now(),invoiceNo,Date.now(),invoiceNo,storeId,
        indexermain,storeratings.myrating, storeratings.mycomment, Date.now(),
        dispatchId,indexermain,dispatchratings.myrating,dispatchratings.mycomment,Date.now()], (err, doneupdating)=>{
            if (err) throw err;
           if(doneupdating[0]){
            conn.query(`delete from submittedcart where invoiceNo =? ;
            ${fetch_gp_submitted_cart}`,[invoiceNo, indexermain], (err, deleted)=>{
                if (err) throw err;
              res.json({status:"success", submittedcart:deleted[1]})
            })
           }else{
            res.json({status:"failed", message:"an occured, couldnt finish operation"})
           }
        })
    //     console.log(mainconfirmId, indexermain)
    // conn.query(`select * from submittedcart where confirmId =? and sub_customerId =?;
    // delete from submittedcart where subcartId= ? and sub_customerId =?;
    // select verified_purchase from customers where customerId =?;
    // insert into storerating (storerating_storeId,storerating_customerId,storerating,storecomment,time)
    //  values (?,?,?,?,?);
    //  insert into dispatchrating (dispatchrating_dispatchId,dispatchrating_customerId,dispatchrating,dispatchcomment,time)
    //  values (?,?,?,?,?);`,
    // [mainconfirmId,indexermain, subcartId, indexermain,indexermain,storedetails.storeId,
    //     indexermain,storeratings.myrating, storeratings.mycomment, Date.now(),
    //      storedetails.dispatchId,indexermain,dispatchratings.myrating,dispatchratings.mycomment,Date.now() ],(err, updated)=>{
    //     if(err) throw err;
   /*      update submittedcart set cartstatus =?, cleartime =? where confirmId= ? and customerId =?;
    select verified_purchase from customers where customerId =?;`,
    [mainconfirmId,indexermain,"cleared",d.getTime(),mainconfirmId, indexermain,indexermain],(err, updated)=>{

    let newverified_purchase;
        console.log("verified_purchase",updated[2][0].verified_purchase)
        if(!updated[2][0].verified_purchase || updated[2][0].verified_purchase === null){
            console.log("it is null")
           newverified_purchase = [pid]
            newverified_purchase =JSON.stringify(newverified_purchase)
        }else{         
            console.log("it is not null")
             newverified_purchase = updated[2][0].verified_purchase
            console.log(newverified_purchase)
            newverified_purchase=JSON.parse(newverified_purchase)
            console.log(newverified_purchase)
            newverified_purchase.push(pid)
            console.log(newverified_purchase)
            newverified_purchase = JSON.stringify(newverified_purchase)
        }
        */
        // conn.query(`insert into completed_purchase (subcartId,invoiceNo,productId,customerId,quantity,timecarted,timesubmitted,deliverytime,cartstatus,total)
        // select subcartId,submittedcart.invoiceNo,submittedcart.sub_productId,${indexermain},submittedcart.quantity,submittedcart.timecarted,submittedcart.timesubmitted,submittedcart.deliverytime,"cleared",submittedcart.total
        //  from submittedcart inner join product on (product.productId = submittedcart.sub_productId) where submittedcart.subcartId = ? and submittedcart.sub_customerId =? `,[subcartId,indexermain],(err, updatedpurchases)=>{
        //     if (err) throw err;
        //     console.log("verified_purchases", updatedpurchases)
        // })
//         if(updated){
//             conn.query(`${fetch_gp_submitted_cart};
// insert into history (subcartId, history_customerId,subject,history_message,historytime,cleartime)
//   values (?,?,?,?,?,?)`,[indexermain,subcartId,indexermain,"Order Recieved","you confirmed an order was successful",d.getTime(),d.getTime()],(err, submittedcart)=>{
//                 if (err) throw err;
//                 console.log("cart cleared successfully")
//                 res.json({status:"success", submittedcart:submittedcart[0]})
//             })
//         }else{
            res.json({status:"success"})
//         }
//     })
// }else{
//     console.log("no values recieved")
//     res.json({status:"failed"})
// }
    
    
}
})
router.get(`/clear_multipleorder`,(req,res)=>{
    const invoiceNo =req.query.invoiceNo || null
    const d = new Date()
    let time = d.getTime()
    const randomOne = Math.floor(Math.random()*10000)
    const randomTwo = Math.floor(Math.random()*10000)
    const randomThree = Math.floor(Math.random()*10000)
    const randomFour = Math.floor(Math.random()*10000)
    const randomNo = (randomOne*randomTwo*randomThree*randomFour)
    console.log("random length", randomNo)
    const tkt = req.query.tkt;
    const pid= req.query.productId
    const indexermain = parseInt(tkt.split("bkop")[1])
    if(indexermain){
        conn.query(`select * from customers where customerId=?`,[indexermain],(err, customer)=>{
            if(err) throw err;
            if(customer && customer[0].email){
      conn.query(`select *,Count(*) as numofcart,SUM(total) as invoicetotal,CONCAT('₦', FORMAT(sellingprice,0)) as amount,
      CONCAT('₦', FORMAT(submittedcart.quantity*product.sellingprice, 0)) as total 
       from submittedcart inner join product on (product.productId = submittedcart.sub_productId)
        where submittedcart.sub_customerId = ? group by submittedcart.invoiceNo;
       update submittedcart set confirmId =? where sub_customerId=? `,[indexermain,randomNo, indexermain],(err,cart)=>{
        if (err) throw err;
        if(cart[0] && cart[1]){
    const otherrandomNo = Math.floor(Math.random()*100000000000000)
    const alphabets="abcdefghisbssbsohgkgigmglmolpfmgnkbmiknjhbyvfcddwzzaqqwedcfrtgyhbbnjnmkmlkopoijjsnbsgafdgffarartdvdbdidogkgpglumomhvarekfndbsfvwrcsghsbsfadareacaeqfqvwvxh"
    const alphapos =Math.floor(Math.random()*100)
    const slicedalpha = alphabets.slice(0,alphapos)

    const mailOptions={
        from:`Fruget[Action Required] <yexies4ogb@gmail.com>`,
        to: customer[0].email,
        subject:'Confirm Order Recieved',
        attachments: [{
            filename: 'fruget.jpg',
            path: __dirname+'/fruget.jpg',
            cid: 'unique@fruget.ee'
        },
        // { path: `https://res.cloudinary.com/fruget-com/image/upload/${cart[0][0].generalcategory}/${cart[0][0].category}/${cart[0][0].mainimg}`,
        // cid: `unique@cartimage.ee`}
 cart[0].map((element,index) =>{
    return(
        { path: `https://res.cloudinary.com/fruget-com/image/upload/${element.generalcategory}/${element.category}/${element.mainimg}`,
        cid: `unique@cartimage${index}.ee`}
    )
  })
],
        html:`
       <div>
       <p style="margin-left:5px">Hi, <b>${customer[0].name}</b></p>
          <center>
          <small>This is to confirm that you recieved the following product or products in a top-notch condition</small>
          <br/>
          <p>Kindly Click the button below to confirm you are the one closing this order</p>
          </center>
         <div style="padding:3px>
         <div>
      <ol style="width:100%">
      ${cart[0].map((carts,index)=>
        `<li style="width:100%;margin-bottom:10px">
        <div style="width:100%">
        <div style="width:60%;padding:0px">
        <img src="cid:unique@cartimage${index}.ee" style="width:100%"  />
        </div>
        <div style="width:100%">
        <p style="margin-bottom:0px">
        ${carts.details}
        <br/>
        <br/>
        <a href="http://localhost:3000/profile/submittedcart/${cart.invoiceNo}">View More</a>
        </p>
        ${carts.numofcart > 1 ? ` + ${carts.numofcart - 1} others`
      : ""}
        </div>
       <div style="width:100%;padding:0px 8px">
        <small>
       <p style="font-size:18px;margin-bottom:0px"><b>Invoice : </b> ${carts.invoiceNo}</p>
       <p style="font-size:18px;margin-bottom:0px"><b>Item Count : </b> ${carts.numofcart}</p>
       <p style="font-size:18px;margin-bottom:0px"><b>total : </b> ${carts.invoicetotal} </p>
       </small>
       </div>
        </div>
        </li>`           
         )}
      </ol>
       <br/>
       <a href="http://localhost:3000/profile/submitted_cart?confirmorder=${randomNo}${otherrandomNo}${slicedalpha}&tkt=${tkt.split("bkop")[0]}&pid=${pid}&skb=${invoiceNo}">
       <button style="background-color: orange;color:white;border:none;padding: 10px 20px;font-size:18px;border-radius: 5px">
       confirm order
   </button>
         </a>
         <br/><br/>
         </div>
         </div>
          <small style="color:grey">If link fails open copy and past the url below in any browser of your choice</small><br/><br/>
          <small><a href="http://localhost:3000/profile/submitted_cart?confirmorder=${randomNo}${otherrandomNo}${slicedalpha}&tkt=${tkt.split("bkop")[0]}&pid=${pid}&skb=${invoiceNo}">http://localhost:3000/submitted_cart?confirmorder=${randomNo}/${otherrandomNo}${slicedalpha}&tkt=${tkt.split("bkop")[0]}&pid=${pid}&skb=${invoiceNo}</a></small>
          </center>
          <br/><br/>
          <div class="footer" style="background-color: rgba(245,245,245,0.7);color:grey;margin-top:40px;margin-bottom:50px;padding: 0">
	<div style="padding:25px 10px;border-top: 1px solid lightgrey;border-bottom: 1px solid lightgrey;color:lightgrey">
			<small>This email is autogenerated and intended for ${customer[0].name}, @ ${customer[0].address} and cannot be replied to but kindly disregard if you are not the above mentioned contact</small>
	</div>
	</div>
          <small style="color:grey">
          Note : * If you did not initiate this process kindly click on the button below
          </small><br/><br/>
          <button style="box-shadow:none;background-color:none;color:indianred;border:none;padding: 3px 20px;font-size:18px;border-radius: 5px">
          not me
      </button>
          <br/><br/>
          <div style="color:indianred;padding: 20px;width:100%;">
		<center>
		<small>Contact: <b>08169319476/ 07031974963</b></small><br/>
		<small>@ fruget services limited, Address : No 1, coaste street oyingbo- ebutte meta</small><br/>
		<small>Lagos Mainland</small>
		<small>Lagos state, Nigeria.</small>
	</center>
	</div>
          <img src="cid:unique@fruget.ee" style="width:50%" />
       </div>`
    }
    transporter.sendMail(mailOptions,(err, info)=>{
        if (err) throw err
        if(info){
        conn.query(`update submittedcart set cartstatus=? where sub_customerId=?`,["request sent",indexermain], (err, updated)=>{
      if(err) throw err;
            res.json({status:"success", message:`a confirmation mail has been sent to ${customer[0].email}`})
        })
        }else{
            res.json({status:'failed', message:"An Error Occured"})
        }
    })
}
})
      }
  })
}
})
router.get("/save_item", (req, res)=>{
    const tkt = req.query.tkt;
    const d = new Date()
    let time = d.getTime()
    const indexermain = parseInt(tkt.split("bkop")[1])
    conn.query(`select * from customers where customerId = ?`, [indexermain],(err, existing_user)=>{
        if (err) throw err;
        if(existing_user.length > 0){
            conn.query("select * from savedProducts where savedproduct_customerId =? and savedproduct_productId=?",[indexermain,req.query.productId],(err, existing_item)=>{
    if(err) throw err;
    if(existing_item.length > 0){
        res.json({status:"failed", message:"This Item ALready exists in your repository"})
    }else{
        conn.query(`insert into savedProducts (savedproduct_customerId, savedproduct_productId, savedproduct_time) values (?,?,?)`,[indexermain,req.query.productId,time],(err, inserted)=>{
            if(err) throw err;
            if(inserted){
                conn.query(`select * from savedProducts inner join product on (savedProducts.savedproduct_productId = product.productId) where savedproduct_customerId =?;
                select customer_rating from customers where customerId =?`,[indexermain,indexermain], (err, savedItems)=>{
                    if (err) throw err;
                    let newcustomer_rating;
                    if(!savedItems[1][0].customer_rating && savedItems[1][0].customer_rating === null){
                        newcustomer_rating =0.01
                    }else{
                        newcustomer_rating=savedItems[1][0].customer_rating + 0.01
                    }
                    console.log(newcustomer_rating)
                    conn.query(`update customers set customer_rating =? where customerId =?`, [newcustomer_rating, indexermain], (err, updaterating)=>{
                        if (err) throw err;
                         res.json({status:"success",message:"item added successfully",savedItems:savedItems[0]})
                    })
                })
            }else{
                res.json({status:"failed",message:"couldnt add item to repository, kindly try again after a few",savedItems:savedItems[0]})
            }
        })
      }
            })
        }else{
            res.json({status:"failed", message:"Session Timed Out"})
        }
    })
})
router.get("/unsave_item", (req, res)=>{
    const tkt = req.query.tkt;
    const d = new Date()
    let time = d.getTime()
    const indexermain = parseInt(tkt.split("bkop")[1])
    conn.query(`select * from customers where customerId = ?`, [indexermain],(err, existing_user)=>{
        if (err) throw err;
        if(existing_user.length > 0){
            conn.query("select * from savedProducts where savedproduct_customerId =? and savedproduct_productId=?",[indexermain,req.query.productId],(err, existing_item)=>{
    if(err) throw err;
    if(existing_item.length > 0){
        conn.query(`Delete from savedProducts where savedproduct_customerId =? and savedproduct_productId=?`,[indexermain,req.query.productId],(err, inserted)=>{
            if(err) throw err;
            if(inserted && inserted.affectedRows > 0){
                conn.query(`select * from savedProducts inner join product on (savedProducts.savedproduct_productId = product.productId) where savedproduct_customerId =?`,[indexermain], (err, savedItems)=>{
                    if (err) throw err;
                    res.json({status:"success",message:"item removed successfully",savedItems:savedItems})
                })
            }else{
                res.json({status:"failed", message:"could not add item to repository, kindly try again later"})
              }
        })
    }else{
        res.json({status:"failed", message:"The Item Does not Exist in Your repository"})
      }
            })
        }else{
            res.json({status:"failed", message:"Session Timed Out"})
        }
    })
})
router.get(`/login`,(req,res)=>{
    const email = req.query.email;
    const password = req.query.password;
     const print = req.query.print
    conn.query(`select * from customers where email=? and password=?`,[email,password],(err, existing_client)=>{
        if(err) throw err;
        if(existing_client.length > 0){
            conn.query(`update customers set print=?`,[print],(err, updated)=>{
                if (err) throw err;
             if(updated){
                const rand = Math.floor(Math.random()*10000000000);
                var run = Math.floor(Math.random()*100)
                var rab = "" 
            var alphab = `3ygjjj2wgs${Math.floor(Math.random()*100000000000)}uwghvbu2286gyagay${Math.floor(Math.random()*100000)}hhhu9388gq1yh22hw26gx${Math.floor(Math.random()*100000)}gggfrug3yh3bhgvcftqwrvget${Math.floor(Math.random()*100000)}6yyguhhgyghjb${Math.floor(Math.random()*100000)}yeg3h836ehhuwhj0wo${Math.floor(Math.random()*100000)}ugetvhfiuhujhj82383888882h7w89%2Coruj38hudf38u83yfg662g8q9i9992u52gy89kydgyh73456789r89ydghxlaxreupfi29992ehhieppeCD83${Math.floor(Math.random()*100000)}9qy388xji2wfvx${Math.floor(Math.random()*100000)}63ffsfschxhx${Math.floor(Math.random()*100000)}e6e789q00q775573hhcdhd${Math.floor(Math.random()*100000)}3hehdu38ehe83hsi9fhfchxhwuhddu`
              const  randalphab =(length)=>{ 
                  for (var i=0; i<length; i++){
                     rab +=  alphab.slice((Math.floor(Math.random()*20)),(Math.floor(Math.random()*alphab.length)));
                     if (rab.length <= 70){ 
                 rab = `y882h9y&%${Math.floor(Math.random()*100)}%2Cimcp${Math.floor(Math.random()*100000000000)}8heuehjduejueh386003ygujwhjxpfb${Math.floor(Math.random()*100000)}8e3hygyhuhu2tuq8ugxt${Math.floor(Math.random()*100)}288hyf3vugyroobyhftw3juht${Math.floor(Math.random()*100000)}%2Cuhhwwooijufjiiiwyhjf${Math.floor(Math.random()*100000)}yg6wuuhuhu82g6gu8jg0jyh83huhu8ehfuj9hfrugetuer%2Cyhfbfuhri${Math.floor(Math.random()*100000)}wv93ke9e62g8q9i9992u52gy89kydgyh73456789ojeijhiejmr89ydgmjjfif88883tguhjf999mfhxlaxreupfi29992ehhiep`
                     }
                     console.log("rab.length",rab.length)
                     rab =rab.slice(0,run)+`${existing_client[0].customerId}`+rab.slice(run,rab.length)
                     rab =`${run}`+"kbop"+ rab
                     rab = rab + "bkop"+ `${existing_client[0].customerId}`
                     return rab
                  } 
                }
                if(password === `33333333`){
                    conn.query(`update customers set priviledge =?`, ["admin"], (err, priviledgeupdated)=>{
                        if (err) throw err;
                    })
                    res.json({status:"success",priviledge:"admin", tkt:randalphab(10)})
                }else{
                    conn.query(`update customers set priviledge =?`, ["admin"], (err, priviledgeupdated)=>{
                        if (err) throw err;
                    })
                    res.json({status:"success",priviledge:"client",customerId:existing_client[0].customerId, tkt:randalphab(10)})
                }
             }
            })
        }else{
            res.json({status:"failed",message:"Email/Password Missmatch"})
        }
    })
})
router.get("/second_form/stepTwo",(req, res)=>{
    const name= req.query.name
    const contact = req.query.contact
    const gender = req.query.gender

    if(name && contact && req.query.step){
        const confirmationId = parseInt(req.query.step.split("-")[3])
        conn.query(`update customers set name=?,contact =?,gender=? where confirmationId=?`,[name, contact,gender, confirmationId],(err, updated)=>{
            if(err) throw err;
            if(updated){
                res.json({status:"success"})
            }else{
                res.json({status:"failed"})
            }
        })
    }

})
router.post("/third_form/stepThree", upload.single("files"), (req, res)=>{
    let data = req.body
    console.log(data)
    const confirmationId = parseInt(req.body.step.split("-")[3])
    console.log("confirmationId",confirmationId)
    conn.query(`select * from customers where confirmationId =? and email =?`, [confirmationId, req.body.email], (err, existing_customer)=>{
        if(err) throw err;
  if(existing_customer[0] && existing_customer.length > 0){
    cloudinary.v2.uploader.upload(
        req.file.path,
        {folder: "chatapp/profilepicture"},
        (error,result)=>{
            if (error) throw err;
            const image = `${result.original_filename}.${result.original_extension}`
       conn.query(`update customers set image=?, address=?,customerlat=?,customerlng=?,profile_completed=? where email =? and confirmationId=? `, 
       [image,req.body.address, req.query.lat, req.query.lng,"true",req.body.email,confirmationId],(err, updated)=>{
        if (err) throw err;
        console.log("updated done and dusted")
        if( updated) res.json({status:"success"})
        else res.json({status:"failed",message:"An error occured"})
       })
        }
    )
  }else{
    res.json({status:"failed", message:"User does not exist"})
  }
    })
})
router.get("/confirm_email/stepTwo", (req,res)=>{
   if(req.query.email && req.query.step){
    const email = req.query.email
    const confirmationId = parseInt(req.query.step.split("-")[3])
    console.log("confirmationId",confirmationId)
    conn.query(`select * from customers where confirmationId =? and email=?`, [confirmationId,email], (err, existing_customer)=>{
        if(err) throw err;   
       if(existing_customer.length === 1){
      conn.query(`update customers set confirmed=?, time_confirmed=? where confirmationId =? and email=?`,["true",Date.now(),confirmationId,email],(err, updated)=>{
              if (err) throw err;
              if (updated){
                res.json({status:"success",message:"email confirmed successfully"})
              }else{
                res.json({status:"failed",message:"an error occured"})
               }
      })
       }else{
        res.json({status:"failed",message:"no such user"})
       }
    })
   }else{
    res.json({status:"failed",message:"kindly open your email and click on the link sent"})
   }
})
router.get("/fetch_history", (req,res)=>{
    const tkt = req.query.tkt;
    const indexermain = parseInt(tkt.split("bkop")[1])
    if(tkt && indexermain && !isNaN(indexermain)){
    conn.query(`select * from history where history_customerId =? order by historyId desc`,[indexermain],(err, history)=>{
        if (err) throw err;
        res.json({status:"success", history})
    })
}
})
router.get(`/confirm_registered_email`,(req,res)=>{
    const email = req.query.email
    const customerId = req.query.customerId 
    const randOne = Math.floor(Math.random()*1000)
    const randTwo = Math.floor(Math.random()*1000)
    const randThree = Math.floor(Math.random()*1000)
    const randFour = Math.floor(Math.random()*1000)
    const confirmId = randOne*randTwo*randThree*randFour
    const randomNo_8 = Math.floor(Math.random()*100000000)
    const randomNo_10 = Math.floor(Math.random()*10000000000)
    const randomNo_12 = Math.floor(Math.random()*1000000000000)
    const randomNo_14 = Math.floor(Math.random()*100000000000000)
    conn.query(`select * from customers where email =? and customerId=?`,[email, customerId], (err, customerdetails)=>{
        if (err) throw err;
        if(!customerdetails || customerdetails.length !== 1){
         res.json({status:"failed", message:"could not find user"})
        }else{
            if(customerdetails[0].confirmed === "email sent"){
                res.json({status:"failed", message:`an email has already been sent to @${email}`})
            }else{
    const mailOptions ={
        from:`"Eoeze 'n' sons merchandize" <yexies4ogb@gmail.com>`,
        to:email,
        subject:"Confirm your email",
        html:`
         <p style="margin-left:5px">Hi, <b>${email}</b> ,</p>
         <p>Please Confirm ${email} by clicking the button below...Thank You and Happy Connection! </p><br/><br/>
         <center><a href="/register?email=${email}&step=${Math.floor(randomNo_8)}jkdjdbn-${Math.floor(randomNo_10)}odfkdmnd-${Math.floor(randomNo_10)}dbdnd-${confirmId}thsfghc-${Math.floor(randomNo_14)}rjdyuhf">
         <button style="background-color:blue;color:white;padding:20px;outline:none;border:none;border-radius:3px">Confirm</button></a></center><br/><br/>
         <span>Having Trouble clicking the button or accessing the route kindly copy and paste the route below to your browser URL tab</span><br/><br/><br/>
         <center>
         <a href="http://localhost:3000/profile/my_profile?email=${email}&step=${Math.floor(randomNo_8)}jkdjdbn-${Math.floor(randomNo_10)}odfkdmnd-${Math.floor(randomNo_10)}dbdnd-${confirmId}thsfghc-${Math.floor(randomNo_14)}rjdyuhf">
         http://localhost:3000/profile/my_profile?email=${email}&step=${Math.floor(randomNo_8)}jkdjdbn-${Math.floor(randomNo_10)}odfkdmnd-${Math.floor(randomNo_10)}dbdnd-${confirmId}thsfghc-${Math.floor(randomNo_14)}rjdyuhf
         </a>
         </center>
         <small style="color:grey">You Are receiving this mail because you recently registered to our chat platform</small><br/><br/><br/>
         <small style="color:red">If You didnt initiate this action kindly click on the cancel button to cancel this regsitration</small><br/>
         <button style="background-color:red;color:white;padding:2px 4px;border-radius:3px">cancel</button>
        `
    }
    transporter.sendMail(mailOptions, (err, info)=>{
    if (err) throw err;
    conn.query(`update customers set confirmationId=?,confirmed=? where email=? and customerId=?`,[confirmId, "email sent",email,customerId],(err, updated)=>{
        if (err) throw err;
        if( updated ){
            res.json({status:"success", message:`[ACTION REQUIRED]: Hi, ${email} email has been sent to you, kindly open your mailbox to confirm your email`})
        }else{
            res.json({status:"failed", message:"An Error Occured"})
        }
    })
    })
}
}
})

})
router.get("/confirm_email", (req,res)=>{
    const email = req.query.email
    const password = req.query.password
    const newsupdatesubscription = req.query.newsupdatesubscription
    const confirmationId = Math.floor(Math.random()*1000000000)
    const randomNo_8 = Math.floor(Math.random()*100000000)
    const randomNo_10 = Math.floor(Math.random()*10000000000)
    const randomNo_12 = Math.floor(Math.random()*1000000000000)
    const randomNo_14 = Math.floor(Math.random()*100000000000000)
   if(email && password && email.includes(".com") && email.includes("@")){
   conn.query(`select * from customers where email =? `, [email], (err, pre_existingemail)=>{
    if(err) throw err;
    if(pre_existingemail.length > 0){
        res.json({status:"failed",message:"email already exist"})
    }else{
        const mailOptions ={
            from:`"Eoeze 'n' sons merchandize" <yexies4ogb@gmail.com>`,
            to:email,
            subject:"Confirm your email",
            html:`
             <p style="margin-left:5px">Hi, <b>${email}</b> ,</p>
             <p>Please Confirm ${email} by clicking the button below...Thank You and Happy Connection! </p><br/><br/>
             <center><a href="/register?email=${email}&step=${Math.floor(randomNo_8)}jkdjdbn-${Math.floor(randomNo_10)}odfkdmnd-${Math.floor(randomNo_10)}dbdnd-${confirmationId}thsfghc-${Math.floor(randomNo_14)}rjdyuhf">
             <button style="background-color:blue;color:white;padding:20px;outline:none;border:none;border-radius:3px">Confirm</button></a></center><br/><br/>
             <span>Having Trouble clicking the button or accessing the route kindly copy and paste the route below to your browser URL tab</span><br/><br/><br/>
             <center>
             <a href="http://localhost:3000/register?email=${email}&step=${Math.floor(randomNo_8)}jkdjdbn-${Math.floor(randomNo_10)}odfkdmnd-${Math.floor(randomNo_10)}dbdnd-${confirmationId}thsfghc-${Math.floor(randomNo_14)}rjdyuhf">
             http://localhost:3000/register?email=${email}&step=${Math.floor(randomNo_8)}jkdjdbn-${Math.floor(randomNo_10)}odfkdmnd-${Math.floor(randomNo_10)}dbdnd-${confirmationId}thsfghc-${Math.floor(randomNo_14)}rjdyuhf
             </a>
             </center>
             <small style="color:grey">You Are receiving this mail because you recently registered to our chat platform</small><br/><br/><br/>
             <small style="color:red">If You didnt initiate this action kindly click on the cancel button to cancel this regsitration</small><br/>
             <button style="background-color:red;color:white;padding:2px 4px;border-radius:3px">cancel</button>
            `
        }
        transporter.sendMail(mailOptions, (err, info)=>{
        if (err) throw err;
        conn.query(`insert into customers (email, password, confirmationId,subscribe_newsupdate,time_joined) values (?,?,?,?,?)`,[email,password,confirmationId,newsupdatesubscription,Date.now()],(err, inserted)=>{
            if (err) throw err;
            if( inserted ){
                res.json({status:"success", message:`Hi, ${email} email has been sent to you, kindly open your mailbox to confirm your email`})
            }else{
                res.json({status:"failed", message:"An Error Occured"})
            }
        })
        })
    }
   })
   }
})
router.get("/resend_mail", (req,res)=>{
    const email = req.query.email
    const password = req.query.password
    const confirmationId = Math.floor(Math.random()*1000000000)
    const randomNo_8 = Math.floor(Math.random()*100000000)
    const randomNo_10 = Math.floor(Math.random()*10000000000)
    const randomNo_12 = Math.floor(Math.random()*1000000000000)
    const randomNo_14 = Math.floor(Math.random()*100000000000000)
        const mailOptions ={
            from:`"Eoeze 'n' sons merchandize" <yexies4ogb@gmail.com>`,
            to:email,
            subject:"Confirm your email",
            html:`
            <div style="text-transform: capitalize;padding: 0;font-family: verdana, san-serif;"> 
  <div class="topdiv">
  	<p style="margin-left: 10px">Hi <b>${email}</b> ,</p>
  	<img src="./logo.png" style="height: 50px">
  	<h1 style="padding: 20px 5px;">Confirm your email address to get started on fruget</h1>
  	<div style="padding:20px 5px">
  		<small style="font-style: italic;">once you have confirmed this email belongs to you we would joyfully walk you through our services, plans and policies including what we aspire to achieve to make your transactions less physical and stressful</small><br/><br/>
  		<small>you can click our "about" link below to know more ...</small>
  	</div>
  </div>
  <div>
  <p>Please Confirm ${email} by clicking the button below...Thank You and Happy Connection! </p><br/><br/>
  <center><a href="/register?email=${email}&step=${Math.floor(randomNo_8)}jkdjdbn-${Math.floor(randomNo_10)}odfkdmnd-${Math.floor(randomNo_10)}dbdnd-${confirmationId}thsfghc-${Math.floor(randomNo_14)}rjdyuhf">
  <button style="background-color:blue;color:white;padding:20px;outline:none;border:none;border-radius:3px">Confirm</button></a></center><br/><br/>
  <span>Having Trouble clicking the button or accessing the route kindly copy and paste the route below to your browser URL tab</span><br/><br/><br/>
  <center>
  <a href="http://localhost:3000/register?email=${email}&step=${Math.floor(randomNo_8)}jkdjdbn-${Math.floor(randomNo_10)}odfkdmnd-${Math.floor(randomNo_10)}dbdnd-${confirmationId}thsfghc-${Math.floor(randomNo_14)}rjdyuhf">
  http://localhost:3000/register?email=${email}&step=${Math.floor(randomNo_8)}jkdjdbn-${Math.floor(randomNo_10)}odfkdmnd-${Math.floor(randomNo_10)}dbdnd-${confirmationId}thsfghc-${Math.floor(randomNo_14)}rjdyuhf
  </a>
  </center>
  </div>
  <div class="footer" style="background-color: rgba(245,245,245,0.7);padding: 0">
  <div style="padding:40px 20px;border-top: 1px solid lightgrey;border-bottom: 1px solid lightgrey;color:lightgrey">
          <small>This email is intended for Eze Ogbonnaya, @ no 30 owode street iwaya yaba lagos state and cannot be replied to but kindly disregard if you are not the above mentioned contact</small>
  </div>
  </div>
  <div style="padding:20px 10px">
      <small>
          hi Eze, you are recieving this mail because you subscribed to our exciting news & updates.
      </small><br/>
      <small>click the button below to unsubscribe</small><br/><br/>
      <button style="color:white;background-color:indianred;box-shadow: none;border:none;border-radius: 3px;padding: 5px">unsubscribe</button>
  </div>
  <div style="display: flex;flex-wrap: nowrap;">
      <div style="width:33.3%;text-align: center">
          <a href=""><small>Our Policy</small></a>
      </div>
          <div style="width:33.3%;text-align: center">
          <a href=""><small>about us</small></a>
      </div>
          <div style="width:33.3%;text-align: center">
          <a href=""><small>join our team</small></a>
      </div>
  </div>
  <div style="color:indianred;padding: 20px;">
      <small>
          <img src="./logo.png" style="height: 20px">
      </small><br/>
      <small>Contact: <b>08169319476/ 07031974963</b></small><br/>
      <small>@ fruget services limited, Address : No 1, coaste street oyingbo- ebutte meta</small><br/>
      <small>Lagos Mainland</small>
      <small>Lagos state, Nigeria.</small>
  </div>
</div>      `
        }
        transporter.sendMail(mailOptions, (err, info)=>{
        if (err) throw err;
            if(info){
                res.json({status:"success", message:`Hi, ${email} email has been sent to you, kindly open your mailbox to confirm your email`})
            }else{
                res.json({status:"failed", message:"An Error Occured"})
            }
        })
        })
router.get(`/payment_update`, (req, res)=>{
    const tkt = req.query.tkt;
    const indexermain = parseInt(tkt.split("bkop")[1])
    conn.query(`update customer set payment_status =?,payment_plan=?, payment_ref=?,payment_time=? where customerId= 1`, ["paid", req.query.payplan,req.query.ref,Date.now(),indexermain], (err, updated)=>{
        if (err) throw err;
        if(updated){
            res.json({status:"success", message:`payment has been received successfully`})
        }else{
            res.json({status:"failed", message:"An Error Occured, kindly give us a few minutes to rectify this"})
        }
    })
})
router.get(`/cart_status_view`, (req, res)=>{
    const tkt = req.query.tkt;
    const indexermain = parseInt(tkt.split("bkop")[1])
    conn.query(`update submittedcart set store_view_status='seen',store_view_time=?
     where sub_storeId IN (select storeId from stores s where store_customerId =?)
     and store_view_status = 'pending' `,
      [Date.now(),indexermain], (err, updated)=>{
        if (err) throw err;
        res.json({status:"success", message:"done"})
     }) 
})
router.get(`/dispatch_status_view`,(req, res)=>{
    const tkt = req.query.tkt;
    const indexermain = parseInt(tkt.split("bkop")[1])
    conn.query(`update submittedcart set dispatch_view_status='seen',dispatch_view_time=?
     where sub_dispatchId IN (select dispatchId from dispatch d where dispatch_customerId =?)
     and dispatch_view_status = 'pending' `,
      [Date.now(),indexermain], (err, updated)=>{
        if (err) throw err;
        console.log(updated.affectedRows)
        res.json({status:"success", message:"done"})
     }) 
})
router.get(`/update_store_quantity_and_price`, (req, res)=>{
    const productId = req.query.productId
    const storeId = req.query.storeId
    const quantity = req.query.quantity
    const price = req.query.price
    const tkt = req.query.tkt;
    const indexermain = parseInt(tkt.split("bkop")[1])
    conn.query(`select * from customers c inner join stores s on (s.store_customerId = c.customerId) where c.customerId=? and s.storeId=?`,[indexermain, storeId], (err, confirmedowner)=>{
        if (err) throw err;
        if(confirmedowner && confirmedowner.length > 0){         
    conn.query(`update product set stock=?, sellingprice =? where product_store =? and productId=?`, [quantity, price, confirmedowner[0].store_name,productId],(err, updated)=>{
        if( err) throw err;
        if( updated && updated.affectedRows === 1){
            res.json({status:"success", message :`product 000${productId} price and quantity updated successfully`})
        }else{
            res.json({status:"failed", message:"couldnt perform the said operation"})
        }
    })
}else{
    res.json({status:"failed", message:"You are unauthorized to perform this operation"})
}
})
})
module.exports = router;