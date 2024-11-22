const express = require('express');
const router=express.Router();
require('dotenv').config();



const Listing = require("../modules/listings.js");
const Users = require("../modules/user.js");
const Notify = require("../modules/notification.js");
const biding = require("../modules/biding.js");
const Ads = require("../modules/ads.js");



const multer  = require('multer')
const {storage}=require("../cloudConfig.js")
const upload = multer({ storage })
const wrapAsync=require("../utils/wrapAsyc.js")
const flash=require("connect-flash");
const pass=require("passport")




 
//form new add 

router.get("/add",wrapAsync(async(req, res) => {
    
    res.render("profile.ejs");
  }))
  
  ///add new listings
  // router.post('/index',upload.single('listing[image]'), wrapAsync(async (req, res) => {

  router.post('/index',pass.authenticate("jwt",{session:false}),upload.fields([{name:'file'},{name:'file2'}]), wrapAsync(async (req, res) => {
  
let {name,description,price,age,location,catagory,other}=req.body;  
console.log(name,description,price,age,location,catagory,other)

  // console.log(req.file.filename+","+req.file.path)
  console.log("files",req.files)
  let filename1=req.files.file[0].filename;
  let url1=req.files.file[0].path;
  let filename2=req.files.file2[0].filename;
  let url2=req.files.file2[0].path;
    let id = req.user._id;
    let d;
    let user;
    let User = await Users.findById(id).then((data) => {
      d = data;
     user=data.name;
    })
    console.log("urls",url1,url2)
    let newListing = new Listing({name,description,price,catagory,age,location,other })
    newListing.image.push({url:url1,filename:filename1},{url:url2,filename:filename2})
   
    newListing.User.push(d)
    newListing.save();
  
     let notification=Notify.insertMany({
      receiver:"admin",
      message:`${user} add new please check in`
     })
    res.json(
      {
        success:true,
        message:"product add successfully"
      }
    )
  }))
  //delete products
  
  router.get("/delete/:id",pass.authenticate("jwt",{session:false}),wrapAsync(async (req,res)=>{
    let id=req.params.id;
    console.log(id)
    let del= await Listing.findByIdAndDelete(id).then((data)=>{
      console.log(data)

    })
    let d= await biding.deleteMany({"Productid":id });
    let ads= await Ads.deleteMany({"Productid":id });

res.json(
  {
    success:true,
        message:"product delete successfully"
  }
)
  }))
  //edit 
  router.get("/edit/:id",  pass.authenticate("jwt",{session:false}),wrapAsync(async (req,res)=>{
    let id=req.params.id;
    await Listing.findById(id).then((data)=>{
      console.log(data)
      res.json({data})
    })
  }))
  
  
  //UPDATE
  router.post('/update/:id', pass.authenticate("jwt",{session:false}),upload.fields([{name:'file'},{name:'file2'}]),wrapAsync(async (req, res) => {
    let {name,description,price,catagory,age,location,other}=req.body; 
    console.log(name,description,price,catagory,age,location,other)
    
  // router.post('/update/:id',pass.authenticate("jwt",{session:false}),wrapAsync(async (req, res) => {
    // console.log(req.file.filename+","+req.file.path)
    // let filename=req.file.filename;
    // let url=req.file.path;
    console.log(req.body)
      let id = req.params.id;
      let d;
    console.log(id)
      let newListing =  await Listing.findByIdAndUpdate(id,{name,description,price,catagory,age,location,status:"update",other}).then((data)=>{
        
        // console.log("this is data"+data.image[0].id)
        console.log(data)
        
      })
    console.log("file")
      console.log(req.file)
      console.log("files")

      console.log(req.files)


      if(req.files){
      // console.log(req.file.filename+","+req.file.path)
      // let filename=req.file.filename;
      // let url=req.file.path;
      
      
        
     Listing.findById(id).then((data)=>{
      console.log(data);

      if(req.files.file){
        let filename1=req.files.file[0].filename;
      let url1=req.files.file[0].path;
        data.image[0]={url:url1,filename:filename1};

      }
if(req.files.file2){
  let filename2=req.files.file2[0].filename;
      let url2=req.files.file2[0].path;
     data.image[1]={url:url2,filename:filename2};
}
     data.save();
    });
  }
res.json({
  success:true,
  message:"update completed"
}) 
    }))

    
module.exports=router;