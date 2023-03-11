const express = require("express")
const conn = require("./conn")

const router = express.Router()

router.get("/search", (req,res)=>{
  const searchinput = req.query.searchinput
  const page = req.query.page
  let sorter=""
  let setting=""
  const sort = req.query.sorter;
  const tkt= req.query.tkt;
  let indexermain = !tkt ? "null" : parseInt(tkt.split("bkop")[1])
  indexermain = isNaN(indexermain) || !indexermain ? 0 : indexermain
      switch (sort){
        case "low-high": 
        sorter = "sellingprice"
        setting = "ASC"
        break;
        case "high-low":
        sorter = "sellingprice"
        setting = "DESC"
        break;
        case "most-searched":
        sorter = "searchrating"
        setting= "DESC" 
        break; 
        case "most-viewed":
            sorter = "viewrating"
            setting= "DESC" 
            break; 
      
        case "warranty":
        sorter = "warranty"
        setting= "ASC"
        break;
        default:   
        setting="DESC"
        sorter= `viewrating`
        break;  
}  

 const fetchuserdetails = new Promise((resolve, reject) =>{
  if(indexermain){
    conn.query(`select * from customers where customerId =?`, [indexermain], (err, customerdetails)=>{
      if (err) throw err;
    resolve({lat:customerdetails[0].customerlat, lng:customerdetails[0].customerlng})
   })
}else{
  resolve(req.query.coord ? JSON.parse(req.query.coord) : {lat:0, lng:0})
}
 })
if(req.query.setting === `true`){
  conn.query(`update product set searchrating = searchrating +1 where details LIKE '%${searchinput}%' OR brand LIKE '%${searchinput}%'`,(err, updated)=>{
    if (err) throw err;
    console.log("searchrating updated")
  })
}
if((req.query.category && req.query.category !== "null") || (req.query.brand && req.query.brand !== "null")){      
  const limit = 20
  const offset = (req.query.page-1)*20
  fetchuserdetails.then(data => {
  conn.query(`select *,product.productId AS pid, CONCAT('₦', FORMAT(sellingprice, 0)) AS mainprice from product 
  left join stores on (stores.store_name=product.product_store)
  left join shoppingcart on (shoppingcart.productId = product.productId)  where details  LIKE '%${searchinput}%' AND (category = ? OR brand = ?) order by viewrating desc,  abs(stores.storelat- ${data.lat}) asc, abs(stores.storelng-${data.lng}) asc Limit ? Offset ?;
  select brand, COUNT(brand) as brandy from product where details LIKE '%${searchinput}%' OR category = ? OR brand = ?  group by brand;
  select color, COUNT(color) as colory from product where details LIKE '%${searchinput}%'OR category = ? OR brand = ? group by color;
  select Count(*) as numprod from product where details LIKE '%${searchinput}%' OR category = ? OR brand = ?;
  `,[req.query.category,req.query.brand,limit, offset,req.query.category,req.query.brand,req.query.category,req.query.brand,req.query.category,req.query.brand], (err, products)=>{
      if (err) throw err;
      res.json({status:"success",products:products[0], brands:products[1],colors:products[2],numprod:products[3]})
    })
  })
}else{
  fetchuserdetails.then(data => {
  conn.query(`select *,product.productId AS pid,CONCAT('₦', FORMAT(sellingprice, 0)) AS mainprice from product 
  left join stores on (stores.store_name=product.product_store)
  where details  LIKE '%${searchinput}%' ORDER BY ${sorter} ${setting},  abs(stores.storelat- ${data.lat}) asc, abs(stores.storelng-${data.lng}) asc Limit ? Offset ?;
  select brand, COUNT(brand) as brandy  from product where details LIKE '%${searchinput}%' group by brand;
  select color, COUNT(color) as colory  from product where details LIKE '%${searchinput}%' group by color;
  select Count(*) as numprod from product where details LIKE '%${searchinput}%';
  select distinct category from product where details LIKE '%${searchinput}%';
  select  subcat1 as subcat from product where details LIKE '%${searchinput}%'
UNION
select subcat2  as subcat  from product where details LIKE '%${searchinput}%'
UNION 
select subcat3  as subcat  from product  where details LIKE '%${searchinput}%'`,
  [20,(req.query.page-1)*20], (err, goods)=>{
    if (err) throw err;
    res.json({products:goods[0],brands:goods[1],colors:goods[2],numprod:goods[3],searchcat:goods[4], searchsubcat:goods[5]})
  })
})
}
})
router.get("/", (req,res)=>{
  let sorter=""
  let setting=""
  const sort = req.query.sorter;
  const tkt = req.query.tkt;
  let indexermain = !tkt ? "null" : parseInt(tkt.split("bkop")[1])
  indexermain = isNaN(indexermain) || !indexermain ? 0 : indexermain
      switch (sort){
        case "low-high": 
        sorter = "sellingprice"
        setting = "ASC"
        break;
        case "high-low":
        sorter = "sellingprice"
        setting = "DESC"
        break;
        case "most-searched":
        sorter = "searchrating"
        setting= "DESC" 
        break; 
        case "most-viewed":
            sorter = "viewrating"
            setting= "DESC" 
            break; 
      
        case "warranty":
        sorter = "warranty"
        setting= "ASC"
        break;
        default:   
        setting="DESC"
        sorter= `viewrating`
        break;  
}  

 const fetchuserdetails = new Promise((resolve, reject) =>{
  if(indexermain){
    conn.query(`select * from customers where customerId =?`, [indexermain], (err, customerdetails)=>{
      if (err) throw err;
    resolve({lat:customerdetails[0].customerlat, lng:customerdetails[0].customerlng})
   })
}else{
  resolve(req.query.coord ? JSON.parse(req.query.coord) : {lat:0, lng:0})
}
 })
 console.log("fetching initial products")
 if(req.query.store && req.query.store !== "null"){
  console.log("req.query.store",req.query.store)
  const limit = 20
  const offset = (req.query.page-1)*20 
  let brands = req.query.brand 
  if(brands){
   brands= JSON.stringify(brands.split(",")).toString()
   var brandno = brands.split(",").toString().length
   brands = brands.slice(1,brandno-1)
 }else{
  brands = `null`
 }
   fetchuserdetails.then(data =>{
  conn.query(`select *,product.productId AS pid, CONCAT('₦', FORMAT(sellingprice, 0)) AS mainprice from product 
  left join shoppingcart on (shoppingcart.shop_productId = product.productId and shoppingcart.shop_customerId=?)
  left join stores on (stores.store_name=product.product_store) where  product.product_store = ?
  ORDER BY ${sorter} ${setting},abs(stores.storelat- ${data.lat}) asc, abs(stores.storelng-${data.lng}) asc Limit ? Offset ?;
  select brand, COUNT(brand) as brandy from product where category = ? OR store=?  OR subcat1=? OR subcat2=? OR subcat3 =? OR brand IN (${brands})  group by brand;
  select color, COUNT(color) as colory from product where category = ? OR store=?  OR subcat1=? OR subcat2=? OR subcat3 =? OR brand IN (${brands}) group by color;
  select Count(*) as numprod from product where category = ? OR product_store=? OR subcat1=? OR subcat2=? OR subcat3 =? OR brand IN (${brands});`
  ,[indexermain,req.query.store,limit, offset,
    req.query.category,req.query.store,req.query.category,req.query.category,req.query.category
    ,req.query.category,req.query.store,req.query.category,req.query.category,req.query.category,
    req.query.category,req.query.store,req.query.category,req.query.category,req.query.category], (err, products)=>{
      if (err) throw err;
      console.log("product length", products[0].length)
      res.json({products:products[0], brands:products[1],colors:products[2],numprod:products[3]})
    })
  })
 } else if((req.query.category && req.query.category !== "null") || (req.query.brand && req.query.brand !== "null")){      
  console.log("req.query.category",req.query.category)   
  const limit = 20
        const offset = (req.query.page-1)*20
        let brands = req.query.brand
         brands= JSON.stringify(brands.split(",")).toString()
         var brandno = brands.split(",").toString().length
         brands = brands.slice(1,brandno-1)
         fetchuserdetails.then(data =>{
          //store
        conn.query(`select *,product.productId AS pid, CONCAT('₦', FORMAT(sellingprice, 0)) AS mainprice from product 
        left join shoppingcart on (shoppingcart.shop_productId = product.productId and shoppingcart.shop_customerId=?)
        left join stores  on (stores.store_name=product.product_store) where category = ? OR product_store = ?
         OR subcat1=? OR subcat2=? OR subcat3=? OR brand IN (${brands}) ORDER BY ${sorter} ${setting},abs(stores.storelat- ${data.lat}) asc, abs(stores.storelng-${data.lng}) asc Limit ? Offset ?;
        select brand, COUNT(brand) as brandy from product where category = ? OR product_store=?  OR subcat1=? OR subcat2=? OR subcat3 =? OR brand IN (${brands})  group by brand;
        select color, COUNT(color) as colory from product where category = ? OR product_store=?  OR subcat1=? OR subcat2=? OR subcat3 =? OR brand IN (${brands}) group by color;
        select Count(*) as numprod from product where category = ? OR product_store=? OR subcat1=? OR subcat2=? OR subcat3 =? OR brand IN (${brands});`
        ,[indexermain,req.query.category,req.query.store,req.query.category,req.query.category,req.query.category,limit, offset,
          req.query.category,req.query.store,req.query.category,req.query.category,req.query.category
          ,req.query.category,req.query.store,req.query.category,req.query.category,req.query.category,
          req.query.category,req.query.store,req.query.category,req.query.category,req.query.category], (err, products)=>{
            if (err) throw err;
            console.log("brands",products[3] )
            res.json({products:products[0], brands:products[1],colors:products[2],numprod:products[3]})
          })
        })
}else{
  fetchuserdetails.then(data => {
    console.log("req.query.no store and no cat", indexermain, data, req.query.page)
  conn.query(`select *,product.productId AS pid,CONCAT('₦', FORMAT(sellingprice, 0)) AS mainprice from product
   left join shoppingcart on (shoppingcart.shop_productId = product.productId  and shoppingcart.shop_customerId=?) 
   left join stores on (stores.store_name=product.product_store)
   ORDER BY ${sorter} ${setting}, shoppingcart.time_added desc,  abs(stores.storelat- ${data.lat}) asc, abs(stores.storelng-${data.lng}) asc Limit ? Offset ?;
  select brand, COUNT(brand) as brandy  from product group by brand;
  select color, COUNT(color) as colory  from product group by color;
  select * from stores s inner join
  (select product_store from product x group by x.product_store) as p on p.product_store = s.store_name left join
  (select storerating_storeId,count(*) as storeratingcount,avg(storerating) as average from storerating group by storerating_storeId) as averagemain on (s.storeId=averagemain.storerating_storeId);
  select Count(*) as numprod from product`,[indexermain,20, (req.query.page-1)*20], (err, products)=>{
    if (err) throw err;
    console.log("fetching products", products[0].length)
    res.json({products:products[0], brands:products[1],colors:products[2],allstores:products[3],numprod:products[4]})
  })
})
}
})
router.get("/search/fetch_storeproducts", (req,res)=>{
  let sorter=""
  let setting=""
  const sort = req.query.sorter;
  const storesearchinput = req.query.storesearchinput
  const tkt = req.query.tkt;
  let indexermain = tkt !== "null" ? parseInt(tkt.split("bkop")[1]) : "null"
  indexermain = isNaN(indexermain) || !indexermain ? 0 : indexermain

  // conn.query(`select * from product p inner join (select *  from stores s where customerId = ?) as st on (p.store =st.company_name) `,[indexermain], (err, allstoreproducts)=>{
    
  // })
  conn.query(`select * from stores where storeId =?`, [req.query.store], (err, storedetails) =>{
    if (err) throw err;
   if(storedetails && storedetails[0]){
    const store =storedetails[0].store_name
    switch (sort){
        case "low-high": 
        sorter = "sellingprice"
        setting = "ASC"
        break;
        case "high-low":
        sorter = "sellingprice"
        setting = "DESC"
        break;
        case "most-searched":
        sorter = "searchrating"
        setting= "DESC" 
        break; 
        case "most-viewed":
            sorter = "viewrating"
            setting= "DESC" 
            break; 
      
        case "warranty":
        sorter = "warranty"
        setting= "ASC"
        break;
        default:   
        setting="DESC"
        sorter= `viewrating`
        break;  
}  

 const fetchuserdetails = new Promise((resolve, reject) =>{
  if(indexermain){
    conn.query(`select * from customers where customerId =?`, [indexermain], (err, customerdetails)=>{
      if (err) throw err;

    resolve({lat:customerdetails[0].customerlat, lng:customerdetails[0].customerlng})
   })
}else{
  resolve(req.query.coord ? JSON.parse(req.query.coord) : {lat:0, lng:0})
}
 })
 let brands = req.query.brand 
 if(brands){
  brands= JSON.stringify(brands.split(",")).toString()
  var brandno = brands.split(",").toString().length
  brands = brands.slice(1,brandno-1)
}else{
 brands = `null`
}
console.log("store is not available outside",store)
 if(store && store != "null" && store != undefined){
  const limit = 20
  const offset = (req.query.page-1)*20 
 console.log("store is not available",store)
   fetchuserdetails.then(data =>{
  conn.query(`select *,product.productId AS pid, CONCAT('₦', FORMAT(sellingprice, 0)) AS mainprice from product 
  left join shoppingcart on (shoppingcart.shop_productId = product.productId and shoppingcart.shop_customerId=?)
  left join stores on (stores.store_name=product.product_store) where  product.product_store = ? and product.details LIKE '%${storesearchinput}%'
  ORDER BY ${sorter} ${setting},abs(stores.storelat- ${data.lat}) asc, abs(stores.storelng-${data.lng}) asc Limit ? Offset ?;
  select brand, COUNT(brand) as brandy from product where product_store=?  group by brand;
  select color, COUNT(color) as colory from product where product_store=? group by color;
  select Count(*) as numprod from product where product_store=?`
  ,[indexermain,store,limit, offset,
    store,
    store,
    store], (err, products)=>{
      if (err) throw err;
      console.log("product length", products[1].length)
      res.json({products:products[0], brands:products[1],colors:products[2],numprod:products[3]})
    })
  })
 } else if((req.query.category && req.query.category !== "null") || (req.query.brand && req.query.brand !== "null")){      
      const limit = 20
        const offset = (req.query.page-1)*20
         fetchuserdetails.then(data =>{
        conn.query(`select *,product.productId AS pid, CONCAT('₦', FORMAT(sellingprice, 0)) AS mainprice from product 
        left join shoppingcart on (shoppingcart.shop_productId = product.productId and shoppingcart.shop_customerId=?)
        left join stores  on (stores.store_name=product.product_store) where (category = ? OR product_store = ?) and product.details LIKE '%${storesearchinput}%'
         OR subcat1=? OR subcat2=? OR subcat3=? OR brand IN (${brands}) ORDER BY ${sorter} ${setting},abs(stores.storelat- ${data.lat}) asc, abs(stores.storelng-${data.lng}) asc Limit ? Offset ?;
        select brand, COUNT(brand) as brandy from product where category = ? OR store=?  OR subcat1=? OR subcat2=? OR subcat3 =? OR brand IN (${brands})  group by brand;
        select color, COUNT(color) as colory from product where category = ? OR store=?  OR subcat1=? OR subcat2=? OR subcat3 =? OR brand IN (${brands}) group by color;
        select Count(*) as numprod from product where category = ? OR product_store=? OR subcat1=? OR subcat2=? OR subcat3 =? OR brand IN (${brands});`
        ,[indexermain,req.query.category,store,req.query.category,req.query.category,req.query.category,limit, offset,
          req.query.category,store,req.query.category,req.query.category,req.query.category
          ,req.query.category,store,req.query.category,req.query.category,req.query.category,
          req.query.category,store,req.query.category,req.query.category,req.query.category], (err, products)=>{
            if (err) throw err;
            console.log("brands",products[3] )
            res.json({products:products[0], brands:products[1],colors:products[2],numprod:products[3]})
          })
        })
}else{
  fetchuserdetails.then(data => {
  conn.query(`select *,p.productId AS pid from product p 
  inner join (select *  from stores s where store_customerId = ?) as st on (p.product_store =st.store_name)
   left join shoppingcart on (shoppingcart.shop_productId = p.productId  and shoppingcart.shop_customerId=?) where p.details LIKE '%${storesearchinput}%'
   ORDER BY ${sorter} ${setting}, shoppingcart.time_added desc,  abs(st.storelat- ${data.lat}) asc, abs(st.storelng-${data.lng}) asc Limit ? Offset ?;
  select brand,product_store, COUNT(brand) as brandy from product p
  inner join (select * from stores s where store_customerId = ?) as st on (p.product_store =st.store_name) group by p.brand;
  select color,product_store, COUNT(color) as colory  from product p
  inner join (select * from stores s where store_customerId = ?) as st on (p.product_store =st.store_name) group by p.color;
  select Count(*) as numprod from product p 
    inner join (select *  from stores s where store_customerId = ?) as st on (p.product_store =st.store_name)`,[indexermain,indexermain,20, (req.query.page-1)*20,indexermain,indexermain,indexermain], (err, products)=>{
    if (err) throw err;
    res.json({products:products[0], brands:products[1],colors:products[2],numprod:products[3]})
  })
})
}
}else{
  res.json({products:[], brands:[],colors:[],numprod:[]})
}
})
})
router.get("/fetch_storeproducts", (req,res)=>{
  let sorter=""
  let setting=""
  const sort = req.query.sorter;
  const tkt = req.query.tkt;
  let indexermain = tkt !== "null" ? parseInt(tkt.split("bkop")[1]) : "null"
  indexermain = isNaN(indexermain) || !indexermain ? 0 : indexermain

  // conn.query(`select * from product p inner join (select *  from stores s where customerId = ?) as st on (p.store =st.company_name) `,[indexermain], (err, allstoreproducts)=>{
    
  // })
  conn.query(`select * from stores where storeId =?`, [req.query.store], (err, storedetails) =>{
    if (err) throw err;
   if(storedetails && storedetails[0]){
    const store =storedetails[0].store_name
    switch (sort){
        case "low-high": 
        sorter = "sellingprice"
        setting = "ASC"
        break;
        case "high-low":
        sorter = "sellingprice"
        setting = "DESC"
        break;
        case "most-searched":
        sorter = "searchrating"
        setting= "DESC" 
        break; 
        case "most-viewed":
            sorter = "viewrating"
            setting= "DESC" 
            break; 
      
        case "warranty":
        sorter = "warranty"
        setting= "ASC"
        break;
        default:   
        setting="DESC"
        sorter= `viewrating`
        break;  
}  

 const fetchuserdetails = new Promise((resolve, reject) =>{
  if(indexermain){
    conn.query(`select * from customers where customerId =?`, [indexermain], (err, customerdetails)=>{
      if (err) throw err;

    resolve({lat:customerdetails[0].customerlat, lng:customerdetails[0].customerlng})
   })
}else{
  resolve(req.query.coord ? JSON.parse(req.query.coord) : {lat:0, lng:0})
}
 })
 let brands = req.query.brand 
 if(brands){
  brands= JSON.stringify(brands.split(",")).toString()
  var brandno = brands.split(",").toString().length
  brands = brands.slice(1,brandno-1)
}else{
 brands = `null`
}
console.log("store is not available outside",store)
 if(store && store != "null" && store != undefined){
  const limit = 20
  const offset = (req.query.page-1)*20 
 console.log("store is not available",store)
   fetchuserdetails.then(data =>{
  conn.query(`select *,product.productId AS pid, CONCAT('₦', FORMAT(sellingprice, 0)) AS mainprice from product 
  left join shoppingcart on (shoppingcart.shop_productId = product.productId and shoppingcart.shop_customerId=?)
  left join stores on (stores.store_name=product.product_store) where  product.product_store = ?
  ORDER BY ${sorter} ${setting},abs(stores.storelat- ${data.lat}) asc, abs(stores.storelng-${data.lng}) asc Limit ? Offset ?;
  select brand, COUNT(brand) as brandy from product where product_store=?  group by brand;
  select color, COUNT(color) as colory from product where product_store=? group by color;
  select Count(*) as numprod from product where product_store=?`
  ,[indexermain,store,limit, offset,
    store,
    store,
    store], (err, products)=>{
      if (err) throw err;
      console.log("product length", products[1].length)
      res.json({products:products[0], brands:products[1],colors:products[2],numprod:products[3]})
    })
  })
 } else if((req.query.category && req.query.category !== "null") || (req.query.brand && req.query.brand !== "null")){      
      const limit = 20
        const offset = (req.query.page-1)*20
         fetchuserdetails.then(data =>{
        conn.query(`select *,product.productId AS pid, CONCAT('₦', FORMAT(sellingprice, 0)) AS mainprice from product 
        left join shoppingcart on (shoppingcart.shop_productId = product.productId and shoppingcart.shop_customerId=?)
        left join stores  on (stores.store_name=product.product_store) where category = ? OR product_store = ?
         OR subcat1=? OR subcat2=? OR subcat3=? OR brand IN (${brands}) ORDER BY ${sorter} ${setting},abs(stores.storelat- ${data.lat}) asc, abs(stores.storelng-${data.lng}) asc Limit ? Offset ?;
        select brand, COUNT(brand) as brandy from product where category = ? OR store=?  OR subcat1=? OR subcat2=? OR subcat3 =? OR brand IN (${brands})  group by brand;
        select color, COUNT(color) as colory from product where category = ? OR store=?  OR subcat1=? OR subcat2=? OR subcat3 =? OR brand IN (${brands}) group by color;
        select Count(*) as numprod from product where category = ? OR product_store=? OR subcat1=? OR subcat2=? OR subcat3 =? OR brand IN (${brands});`
        ,[indexermain,req.query.category,store,req.query.category,req.query.category,req.query.category,limit, offset,
          req.query.category,store,req.query.category,req.query.category,req.query.category
          ,req.query.category,store,req.query.category,req.query.category,req.query.category,
          req.query.category,store,req.query.category,req.query.category,req.query.category], (err, products)=>{
            if (err) throw err;
            console.log("brands",products[3] )
            res.json({products:products[0], brands:products[1],colors:products[2],numprod:products[3]})
          })
        })
}else{
  fetchuserdetails.then(data => {
  conn.query(`select *,p.productId AS pid from product p 
  inner join (select *  from stores s where store_customerId = ?) as st on (p.product_store =st.store_name)
   left join shoppingcart on (shoppingcart.shop_productId = p.productId  and shoppingcart.shop_customerId=?) 
   ORDER BY ${sorter} ${setting}, shoppingcart.time_added desc,  abs(st.storelat- ${data.lat}) asc, abs(st.storelng-${data.lng}) asc Limit ? Offset ?;
  select brand,product_store, COUNT(brand) as brandy from product p
  inner join (select * from stores s where store_customerId = ?) as st on (p.product_store =st.store_name) group by p.brand;
  select color,product_store, COUNT(color) as colory  from product p
  inner join (select * from stores s where store_customerId = ?) as st on (p.product_store =st.store_name) group by p.color;
  select Count(*) as numprod from product p 
    inner join (select *  from stores s where store_customerId = ?) as st on (p.product_store =st.store_name)`,[indexermain,indexermain,20, (req.query.page-1)*20,indexermain,indexermain,indexermain], (err, products)=>{
    if (err) throw err;
    res.json({products:products[0], brands:products[1],colors:products[2],numprod:products[3]})
  })
})
}
}else{
  res.json({products:[], brands:[],colors:[],numprod:[]})
}
})
})
router.get(`/fetch_productdetails`, (req, res)=>{
  const productId = req.query.productId
  const storeId = req.query.storeId
  conn.query(`select * from product p inner join stores s on (p.product_store = s.store_name) where s.storeId=? and p.productId=?`, [storeId,productId], (err, product)=>{
    if (err) throw err;
    console.log("product.length", product.length)
     if(product && product.length > 0){
       res.json({status:'success', product})
     }else{
      res.json({status:'failed',product:[], message:"you are not authorized to access this route"})
     }
  })
})
router.get("/fetch_categories", (req,res)=>{
    conn.query('SELECT DISTINCT category FROM product;select distinct subcat1,category from product',(err,category)=>{
        if (err) throw err;
      res.json({category:category[0],subcat:category[1]})
    })
  })
  router.get("/fetch_trends",(req, res)=>{
    conn.query(`select *,count(*) as counter from product group by category limit 10;
    select *,CONCAT("₦", FORMAT(sellingprice, 0)) AS mainprice from product order by searchrating desc limit 8;
    select *,CONCAT("₦", FORMAT(sellingprice, 0)) AS mainprice from product order by discount desc limit 20;
    select *,CONCAT("₦", FORMAT(sellingprice, 0)) AS mainprice from product left join productrating using (productId) order by productrating.mainrating desc limit 20;
    select  brand,COUNT(brand) as brandy,officialimg,sum(searchrating) as searchrating from product group by brand order by searchrating desc`,(err, trends)=>{
      if (err) throw err;   
      res.json({status:"success",trends:trends[0],topsearched:trends[1],topbrands:trends[4], topdiscounted:trends[2],toprated:trends[3]})
    })
  })
  router.get('/fetch_store', (req,res)=>{
    const storeId= req.query.storeId
    const tkt = req.query.tkt;
    const indexermain = parseInt(tkt.split("bkop")[1])   
    conn.query(`select * from stores where storeId=?`,[storeId], (err, storedetail)=>{
      if (err) throw err;
      if(storedetail[0] && parseInt(storedetail[0].store_customerId) !== parseInt(indexermain)){
        res.json({status:'failed', message:"unauthorized to access this route"})
      }else{
        res.json({status:'success',storedetail})
      }
    })
  })
  router.get('/fetch_all_stores', (req,res)=>{
    conn.query(`select * from stores limit 15`, (err, stores)=>{
      if (err) throw err;
      if(stores[0]){
        res.json({status:'success',stores})
      }else{
        res.json({status:'failed', message:"an error occured"})
      }
    })
  })
  router.get('/fetch_dispatch', (req,res)=>{
    const dispatchId= req.query.dispatchId
    const tkt = req.query.tkt;
    const indexermain = parseInt(tkt.split("bkop")[1])   
    conn.query(`select * from dispatch where dispatchId=?`,[dispatchId], (err, dispatchdetail)=>{
      if (err) throw err;
      console.log(dispatchdetail,"dispatch[0]")
      if(dispatchdetail[0] && parseInt(dispatchdetail[0].dispatch_customerId) !== parseInt(indexermain)){
        res.json({status:'failed', message:"unauthorized to access this route"})
      }else{
        res.json({status:'success',dispatchdetail})
      }
    })
  })
  router.get("/fetch_similiar",(req, res)=>{
    const category = req.query.category;
    const subcat1 = req.query.subcat1;
    const subcat2 = req.query.subcat2;
    conn.query(`select *,CONCAT("₦", FORMAT(sellingprice, 0)) AS mainprice from product where brand=? order by viewrating desc limit 20;
    select *,CONCAT("₦", FORMAT(sellingprice, 0)) AS mainprice from product where (category=? or subcat1=? or subcat2=?) order by searchrating desc limit 15;
  `,[req.query.brand, category,subcat1,subcat2],(err, similiar)=>{
      if (err) throw err;   
      res.json({status:"success",topsimiliarbrands:similiar[0],similiarcat:similiar[1]})
    })
  })
  router.get(`/fetch_samesellerproducts`, (req, res)=>{
    conn.query(`select * from product where product_store=? order by viewrating desc limit 20`, [req.query.store], (err, samesellerproducts)=>{
      if (err) throw err;
      console.log("samesellerproducts length",req.query.store, samesellerproducts.length)
      res.json({status:'success',samesellerproducts})
    })
  })
router.get("/fetch_details", (req, res)=>{
  const tkt = req.query.tkt;
  const indexermain = tkt.split("bkop")[1]
  const productId = req.query.productId
  console.log("indexermain",indexermain, productId)
  conn.query(`UPDATE product SET viewrating=(select viewrating)+1 WHERE productId = ? ;
  select * from customers where customerId =?;
  select * from product where productId=?`,[productId, indexermain, productId],(err, update)=>{
    if (err) throw err
  conn.query(`select distinct * from stores s inner join product p on (p.product_store = s.store_name and p.details=?) left join ( select *,Count(*) as ratingcount, AVG(st.storerating) as averagerating  from storerating st
   group by st.storerating_storeId) str on (s.storeId=str.storerating_storeId) where store_name IN (select product_store from product where details = ?) and store_name != ?`, [update[2][0].details, update[2][0].details, update[2][0].product_store], (err, stores)=>{
    if (err) throw err;
    let newvispro;
    if(update[1][0].visitedproducts === null){
      newvispro = [`${productId}`]
      newvispro = JSON.stringify(newvispro)
    }else{
      let vispro =  update[1][0].visitedproducts;
      vispro = JSON.parse(vispro)
      console.log(vispro, "vispro",productId)
      if(vispro.includes(`${productId}`)){
       newvispro = update[1][0].visitedproducts
      }else{
        vispro.push(`${productId}`)
        newvispro = JSON.stringify(vispro)
      }
    }
    
  //   left join (select min(completedpurchase_timesubmitted) as myfirstpurchase,completedpurchase_productId,completedpurchase_customerId,count(*) as mycounter, SUM(completedpurchase_quantity) as myquantity from completed_purchase 
  //   where completedpurchase_customerId=? and completedpurchase_productId=? group by completedpurchase_productId ) as counter2 on (counter2.completedpurchase_productId=product.productId) 
  //  left join (select min(completedpurchase_timesubmitted) as firstpurchase,completedpurchase_productId, sum(completedpurchase_quantity) as totalquantity from completed_purchase) as counter3 on (counter3.completedpurchase_productId=product.productId)
    conn.query(` select *,product.productId AS pid,CONCAT("₦", FORMAT(sellingprice, 0)) AS mainprice from product
   left join (select *,store_customerId as custId from stores) as productstore on (productstore.store_name = product.product_store) 
    left join shoppingcart on (product.productId = shoppingcart.shop_productId and shoppingcart.shop_customerId=?) where product.productId=?;   
     select * from productrating inner join customers on (productrating.customerId =customers.customerId) where productrating.productId=? order by productrating.productratingId desc;
    update customers set visitedproducts = ? where customerId =?;
    select avg(mainrating) as avgrating from productrating where productId =?;
    select min(completedpurchase_timesubmitted) as myfirstpurchase,completedpurchase_productId, sum(completedpurchase_quantity) as myquantity,count(*) as mycounter from completed_purchase as counter3 where completedpurchase_customerId=? and completedpurchase_productId=? ;
    select min(completedpurchase_timesubmitted) as firstpurchase,completedpurchase_productId,completedpurchase_customerId,count(*) as totalcounter, SUM(completedpurchase_quantity) as totalquantity from completed_purchase   where completedpurchase_productId=? group by completedpurchase_productId 
   `,[indexermain,productId,productId,newvispro, indexermain,productId,indexermain, productId,productId], (err, product)=>{
        if (err) throw err;
        if (product[0]){
         if(update[2][0].itemsize_index >= 20){
          conn.query(`  select * from dispatch where dispatch_type=? or dispatch_type=? order by abs(dispatchlat-${update[1][0].customerlat}) asc,abs(dispatchlng-${update[1][0].customerlng}) asc`,
          ["vehicle", "hybrid"], (err, availabledispatchers)=>{
            if (err) throw err
            const producthistory ={myprodhis:product[4][0], prodhis:product[5][0]}
            console.log("producthistory",JSON.stringify(producthistory))
            res.json({status:"success",details:product[0],comments:product[1], avgrating:product[3],availabledispatchers,stores,producthistory})
          })
         }else{
          conn.query(`  select * from dispatch where dispatch_type=? order by abs(dispatchlat-${update[1][0].customerlat}) asc,abs(dispatchlng-${update[1][0].customerlng}) asc`,
          ["motorcycle"], (err, availabledispatchers)=>{
            if (err) throw err
            const producthistory ={myprodhis:product[4][0], prodhis:product[5][0]}
            console.log("producthistory",JSON.stringify(producthistory))
            res.json({status:"success",details:product[0],comments:product[1], avgrating:product[3],availabledispatchers, stores,producthistory})
          })
         }
        }else{
          res.json({status:"failed",message:"An Error Occured"})
        }
    })
    }) 
  })
})
router.get(`/confirm_productratemodal`, (req, res)=>{
  const tkt = req.query.tkt;
  const indexermain = tkt.split("bkop")[1]
  const productId = req.query.productId
  conn.query(`select * from completed_purchase where completedpurchase_customerId=? and completedpurchase_productId=?`, [indexermain,productId], (err, havehistory)=>{
    if (err) throw err;
    if(havehistory && havehistory.length > 0){
      console.log("lenght is greater than zero")
      res.json({status:"success"})
    }else{
      console.log("length is zero")
      res.json({status:"failed", message:"sorry! only clients who have a purchase history with this product can rate/comment"})
    }
  })
})
router.get(`/confirm_ratedispatchmodal`, (req, res)=>{
  const tkt = req.query.tkt;
  const indexermain = tkt.split("bkop")[1]
  const dispatchId = req.query.dispatchId
  conn.query(`select * from completed_purchase where completedpurchase_customerId=? and completedpurchase_dispatchId=?`, [indexermain,dispatchId], (err, havehistory)=>{
    if (err) throw err;
    if(havehistory && havehistory.length > 0){
      console.log("lenght is greater than zero")
      res.json({status:"success"})
    }else{
      console.log("length is zero")
      res.json({status:"failed", message:"sorry! only clients who hired this dispatch can rate/comment"})
    }
  })
})
router.get(`/like_productcomment`, (req, res)=>{
  const tkt = req.query.tkt;
  const user = tkt.split("bkop")[1]
  const productratingId = req.query.productratingId
  conn.query(`select * from productrating where productratingId =?`, [productratingId], (err, prorating)=>{
    if (err) throw err;
    if(prorating[0].dislikes && JSON.parse(prorating[0].dislikes).includes(user)){
      let dislikes = prorating[0].dislikes
      dislikes=JSON.parse(dislikes)
      dislikes.splice(dislikes.indexOf(user),1)
      dislikes = JSON.stringify(dislikes); 
    conn.query("Update productrating set dislikes = ? where productratingId = ?",[dislikes, productratingId],(err,updatedlikes)=>{
          if (err) throw err;         
          console.log("updated dislikes")     
  })
}
      if(prorating[0].likes && JSON.parse(prorating[0].likes).includes(user)){
          let likes = prorating[0].likes
          likes=JSON.parse(likes)
          likes.splice(likes.indexOf(user),1)
          likes = JSON.stringify(likes); 
          conn.query("Update productrating set likes = ? where productratingId = ?",[likes,productratingId],(err,updateddislikes)=>{
              if (err) throw err;
              conn.query(" select * from productrating inner join customers on (productrating.customerId =customers.customerId) where productrating.productId=? order by productrating.productratingId desc;",[prorating[0].productId],(err,comments)=>{
                  if (err) throw err;
                  console.log("updated likes")
            res.json({status:"success",comments})
          })  
          })
      }else{
          let likes = JSON.parse(prorating[0].likes)
      console.log("dislikes",typeof(likes),likes)
      likes.push(user) 
      likes=JSON.stringify(likes)
      conn.query("Update productrating set likes = ? where productratingId = ?",[likes,productratingId],(err,updateddislikes)=>{
          if (err) throw err;
          conn.query("select * from productrating inner join customers on (productrating.customerId =customers.customerId) where productrating.productId=? order by productrating.productratingId desc;",[prorating[0].productId],(err,comments)=>{
              if (err) throw err;
              console.log("updated likes")
        res.json({status:"success",comments})
      })  
      })
      }
  })
})
router.get(`/dislike_productcomment`, (req, res)=>{
  const tkt = req.query.tkt;
  const user = tkt.split("bkop")[1]
  const productratingId = req.query.productratingId
  conn.query(`select * from productrating where productratingId =?`, [productratingId], (err, prorating)=>{
    if (err) throw err;
    if(prorating[0].likes && JSON.parse(prorating[0].likes).includes(user)){
      let likes = prorating[0].likes
      likes=JSON.parse(likes)
      likes.splice(likes.indexOf(user),1)
      likes = JSON.stringify(likes); 
    conn.query("Update productrating set likes = ? where productratingId = ?",[likes, productratingId],(err,updatedlikes)=>{
          if (err) throw err;         
          console.log("updated likes")     
  })
}
      if(prorating[0].dislikes && JSON.parse(prorating[0].dislikes).includes(user)){
          let dislikes = prorating[0].dislikes
          dislikes=JSON.parse(dislikes)
          dislikes.splice(dislikes.indexOf(user),1)
          dislikes = JSON.stringify(dislikes); 
          conn.query("Update productrating set dislikes = ? where productratingId = ?",[dislikes,productratingId],(err,updateddislikes)=>{
              if (err) throw err;
              conn.query(`select * from productrating inner join customers on (productrating.customerId =customers.customerId) where productrating.productId=? order by productrating.productratingId desc;`,[prorating[0].productId],(err,comments)=>{
                  if (err) throw err;
                  console.log("updated dislikes")
            res.json({status:"success",comments})
          })  
          })
      }else{
          let dislik = JSON.parse(prorating[0].dislikes)
      console.log("dislikes",typeof(dislik),dislik)
      dislik.push(user) 
      dislik=JSON.stringify(dislik)
      conn.query("Update productrating set dislikes = ? where productratingId = ?",[dislik,productratingId],(err,updateddislikes)=>{
          if (err) throw err;
          conn.query(`select * from productrating inner join customers on (productrating.customerId =customers.customerId) where productrating.productId=? order by productrating.productratingId desc;`,[prorating[0].productId],(err,comments)=>{
              if (err) throw err;
              console.log("updated dislikes")
        res.json({status:"success",comments})
      })  
      })
      }
  })
})
router.get(`/like_dispatchcomment`, (req, res)=>{
  const tkt = req.query.tkt;
  const user = tkt.split("bkop")[1]
  const dispatchratingId = req.query.dispatchratingId
  console.log("dispatchratingId",dispatchratingId)
  conn.query(`select * from dispatchrating where dispatchratingId =?`, [dispatchratingId], (err, disrating)=>{
    if (err) throw err;
    if(disrating[0].dislikes && JSON.parse(disrating[0].dislikes).includes(user)){
      let dislikes = disrating[0].dislikes
      dislikes=JSON.parse(dislikes)
      dislikes.splice(dislikes.indexOf(user),1)
      dislikes = JSON.stringify(dislikes); 
    conn.query("Update dispatchrating set dislikes = ? where dispatchratingId = ?",[dislikes, dispatchratingId],(err,updatedlikes)=>{
          if (err) throw err;         
          console.log("updated dislikes")     
  })
}
      if(disrating[0].likes && JSON.parse(disrating[0].likes).includes(user)){
          let likes = disrating[0].likes
          likes=JSON.parse(likes)
          likes.splice(likes.indexOf(user),1)
          likes = JSON.stringify(likes); 
          conn.query("Update dispatchrating set likes = ? where dispatchratingId = ?",[likes,dispatchratingId],(err,updateddislikes)=>{
              if (err) throw err;
              conn.query(" select * from dispatch left join (select * from dispatchrating dr ) as dsrating on (dsrating.dispatchrating_dispatchId =dispatch.dispatchId) where dispatch.dispatchId=? order by dsrating.dispatchratingId desc",[disrating[0].dispatchrating_dispatchId],(err,dispatchcomments)=>{
                  if (err) throw err;
                  console.log("updated likes")
            res.json({status:"success",dispatchcomments})
          })  
          })
      }else{
          let likes = JSON.parse(disrating[0].likes)
      console.log("dislikes",typeof(likes),likes)
      likes.push(user) 
      likes=JSON.stringify(likes)
      conn.query("Update dispatchrating set likes = ? where dispatchratingId = ?",[likes,dispatchratingId],(err,updateddislikes)=>{
          if (err) throw err;
          conn.query(" select * from dispatch left join (select * from dispatchrating dr ) as dsrating on (dsrating.dispatchrating_dispatchId =dispatch.dispatchId) where dispatch.dispatchId=? order by dsrating.dispatchratingId desc",[disrating[0].dispatchrating_dispatchId],(err,dispatchcomments)=>{
              if (err) throw err;
              console.log("updated likes")
        res.json({status:"success",dispatchcomments})
      })  
      })
      }
  })
})
router.get(`/dislike_dispatchcomment`, (req, res)=>{
  const tkt = req.query.tkt;
  const user = tkt.split("bkop")[1]
  const dispatchratingId = req.query.dispatchratingId
  conn.query(`select * from dispatchrating where dispatchratingId =?`, [dispatchratingId], (err, disrating)=>{
    if (err) throw err;
    if(disrating[0].likes && JSON.parse(disrating[0].likes).includes(user)){
      let likes = disrating[0].likes
      likes=JSON.parse(likes)
      likes.splice(likes.indexOf(user),1)
      likes = JSON.stringify(likes); 
    conn.query("Update dispatchrating set likes = ? where dispatchratingId = ?",[likes, dispatchratingId],(err,updatedlikes)=>{
          if (err) throw err;         
          console.log("updated likes")     
  })
}
      if(disrating[0].dislikes && JSON.parse(disrating[0].dislikes).includes(user)){
          let dislikes = disrating[0].dislikes
          dislikes=JSON.parse(dislikes)
          dislikes.splice(dislikes.indexOf(user),1)
          dislikes = JSON.stringify(dislikes); 
          conn.query("Update dispatchrating set dislikes = ? where dispatchratingId = ?",[dislikes,dispatchratingId],(err,updateddislikes)=>{
              if (err) throw err;
              conn.query(" select * from dispatch left join (select * from dispatchrating dr ) as dsrating on (dsrating.dispatchrating_dispatchId =dispatch.dispatchId) where dispatch.dispatchId=? order by dsrating.dispatchratingId desc",[disrating[0].dispatchrating_dispatchId],(err,dispatchcomments)=>{
                if (err) throw err;
                console.log("updated likes")
          res.json({status:"success",dispatchcomments})
        })  
          })
      }else{
          let dislik = JSON.parse(disrating[0].dislikes)
      console.log("dislikes",typeof(dislik),dislik)
      dislik.push(user) 
      dislik=JSON.stringify(dislik)
      conn.query("Update dispatchrating set dislikes = ? where dispatchratingId = ?",[dislik,dispatchratingId],(err,updateddislikes)=>{
          if (err) throw err;
          conn.query(" select * from dispatch left join (select * from dispatchrating dr ) as dsrating on (dsrating.dispatchrating_dispatchId =dispatch.dispatchId) where dispatch.dispatchId=? order by dsrating.dispatchratingId desc",[disrating[0].dispatchrating_dispatchId],(err,dispatchcomments)=>{
            if (err) throw err;
            console.log("updated likes")
      res.json({status:"success",dispatchcomments})
    })  
      })
      }
  })
})
router.get(`/rate_dispatch`, (req, res)=>{
  const tkt = req.query.tkt;
  const indexermain = tkt.split("bkop")[1]
  const dispatchId = req.query.dispatchId;
  const ratinginputs = JSON.parse(req.query.ratinginputs)
  conn.query(`insert into dispatchrating (dispatchrating_dispatchId,dispatchrating_customerId,dispatchrating, dispatchcomment, dispatchrating_time,likes, dislikes)
  values (?,?,?,?,?,?,?);
  update dispatch set dispatchrating=((select dispatchrating)+?)/2, dispatch_numofrating=(select dispatch_numofrating)+1 where dispatchId=?`, 
  [dispatchId,indexermain, ratinginputs.myrating, ratinginputs.mycomment, Date.now(), '[]', '[]', ratinginputs.myrating, dispatchId], (err, inserted)=>{
    if (err) throw err;
    res.json({status:"success", message:"ratings/comment added successfully"})
  })
})
router.get(`/fetch_all_dispatch`, (req,res)=>{
  const tkt = req.query.tkt;
  const indexermain = tkt.split("bkop")[1]
  conn.query(`select * from customers where customerId=?`,[indexermain],(err, customerdetails)=>{
    if (err) throw err;
   // ${customerdetails[0].customerlat}
    //${customerdetails[0].customerlng}
    if(customerdetails && customerdetails[0]){
      conn.query(`select * from dispatch left join (select *,COUNT(*) as dr_numofrating from dispatchrating dr inner join (select max(dispatchratingId) as maxid from dispatchrating group by dispatchrating.dispatchrating_dispatchId)maxirating on (maxirating.maxid=dr.dispatchratingId) group by dr.dispatchrating_dispatchId) as dsrating on (dsrating.dispatchrating_dispatchId =dispatch.dispatchId ) order by abs(dispatch.dispatchlat-${customerdetails[0].customerlat}) asc, abs(dispatch.dispatchlng-${customerdetails[0].customerlng}) asc`,(err, dispatchservices)=>{
        if (err) throw err;
        res.json({status:"success",availabledispatchers:dispatchservices})
      })
    }
  })
})
router.get(`/fetch_dispatchcomments`, (req, res)=>{
  const dispatchId= req.query.dispatchId
      conn.query(`select * from dispatch left join (select * from dispatchrating dr ) as dsrating on (dsrating.dispatchrating_dispatchId =dispatch.dispatchId) where dispatch.dispatchId=? order by dsrating.dispatchratingId desc`,[dispatchId],(err, dispatchcomments)=>{
        if (err) throw err;
        res.json({status:"success",dispatchcomments:dispatchcomments})
      })
})
router.get(`/fetch_visitedproducts`, (req,res)=>{
  const tkt = req.query.tkt;
  const indexermain = tkt.split("bkop")[1]
  if(indexermain){
    conn.query(`select * from customers where customerId=?`,[indexermain],(err,customers)=>{
      if (err) throw err;
      if(customers[0].visitedproducts){
        const custo = JSON.parse(customers[0].visitedproducts).toString()
        console.log("custo",custo)
        conn.query(`select * from product where productId IN (${custo || "null"})`,(err, product)=>{
          if (err) throw err;
         
          res.json({status:"success",visitedproducts:product})
        })
      }
    })
  }
})

router.get(`/fetch_topsearched`, (req, res)=>{
  conn.query(`select * from product order by searchrating desc limit 15 `, (err, topsearched)=>{
    if (err) throw err;
    res.json({topsearched:topsearched})
  })
})
module.exports = router;