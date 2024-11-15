require('dotenv').config();

var cors = require('cors')
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const express = require('express');
const app = express();
const port = process.env.PORT||3000
const mongoose = require("mongoose");
const Users = require("./modules/user.js");
const Listing = require("./modules/listings.js");
const biding = require("./modules/biding.js");
const Notify = require("./modules/notification.js");
const Ads = require("./modules/ads.js");
const path = require("path");
const methodoverride = require("method-override");
const engine = require('ejs-mate');
const { register } = require('module');
var cookieParser = require('cookie-parser')
const multer  = require('multer')
const {storage}=require("./cloudConfig.js")
const upload = multer({ storage })
const session=require("express-session")
const MongoStore = require('connect-mongo');
const wrapAsync=require("./utils/wrapAsyc.js")
const ExpressError=require("./utils/ExpressError.js");
const listRoute=require("./routers/indexrouter.js");
const { receiveMessageOnPort } = require('worker_threads');
const flash=require("connect-flash");

const passport=require("./config/passport");
const pass=require("passport");
const { error } = require('console');


const url=process.env.ATLASDB_URL;


main().then(() => {
    console.log("connected to database");
  }).catch(err => console.log(err));
  
  async function main() {
    
   
    await mongoose.connect('mongodb://127.0.0.1:27017/Revivemart');
  
    // await mongoose.connect(url);
  
  }
  


  app.set("view engine", "ejs")
  app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodoverride("_method"));
app.engine('ejs', engine);
app.use(express.static(path.join(__dirname, "/public")));
app.use(cookieParser());
app.use(passport.initialize())




const corsOptions = {
    // Only allow GET and POST requests
    methods: ['GET', 'POST','PUT','DELETE'],
  };
  
  app.use(cors(corsOptions));
  mongoose.set('strictPopulate', false)

  
  // const store= MongoStore.create({
  //   mongoUrl: url,
  //   crypto: {
  //     secret: process.env.SECRET
  //   },
  //   touchAfter:24*3600
  // })
  
  // store.on("error",()=>{
  //   console.log("error in mongo store",err)
  // })
  
  const sessionOption={
    // store,
    secret:process.env.SECRET||"hello",
    resave:false,
    saveUninitialized:true,
    cookie:{
      expires:Date.now()+7*24*60*60*1000,
      maxAge:7*24*60*60*1000,
      httpOnly:true
    }
  }
  
  
  
  
  app.use(session(sessionOption));

  app.use("/",listRoute)

app.post("/resister",async (req, res) => {

 try {
      
      let {name,emailid,password}= req.body;
      console.log(name+","+emailid+","+password)
      
      const salt = bcrypt.genSaltSync(10); 
    
      let newuser = new Users({
        name,
        emailid,
        password:bcrypt.hashSync(password, salt)
    })
     
      newuser.save().then((data) => {
        res.status(200).json({
          success:true,
          message:"register completed"}
        )
      });
   
    } 
    catch (error) {
     res.status(404).json({
      success:false,
      message:"somthing went wrong"
     });
    }
    })
    
    app.post("/login",wrapAsync(async (req, res,next) => {
    
    
      let {emailid, password } = req.body;
      console.log(emailid + "" + password)
    if(emailid==null||password==null){
      next(new ExpressError(404,"emailid&&password fill please"))
    }
    else{
      let info;
      let admin1 = await Users.find({ emailid ,role:"Admin"}).then((data) => {
        console.log(data)
        //new added
        if (data == "") {
          let user = Users.find({ emailid, role:"User" }).then((data) => {
            console.log(data)
            d = data[0];
            console.log(d)
            if (data == "") {
             return res.status(400).json({
                  error:"register after login please"
              })
            }
            if(d.status=="Block"){
              return res.status(400).json(
                {
                  error:"THIS USER IS BLOCK",
                }
              )
            }
           console.log(data.password)
  
            if(!(bcrypt.compareSync(password, d.password))){
           return res.json({error:"password in incorrect"})
            }
    
            const token=jwt.sign({d},"revivemartcom",{expiresIn:"1d"})
            return res.status(200).json({
            success:true,
            message:"login successgfully",
            token:"Bearer "+token,
        })

          })
        }
        else {
         
          let d = data[0];
          //react
          // res.cookie("data", d).redirect("/show");
          if(!(bcrypt.compareSync(password, d.password))){
            return res.json({error:"password in incorect"})
             }
     
    const token=jwt.sign({d},"revivemartcom",{expiresIn:"1d"})
     return res.status(200).json({
     success:true,
     message:" admin login successgfully",
     token:"Bearer "+token,
 })
    
        }
      })
    }
     
    }));
    

    app.get("/hello",pass.authenticate("jwt",{session:false}),(req,res)=>{
      res.send(
        req.user
      );
  })


//home page
app.get('/show',    pass.authenticate("jwt",{session:false}),
wrapAsync(async (req, res) => {
     console.log("catagory",req.query.catagory);

  // console.log("this sesssion id....."+req.session.data)
  let list;
    let catagory=req.query.catagory;
    if(catagory!="undefined"){
     list = await Listing.find({ status: "Approve",catagory:catagory});
      console.log(list)
    }
    else{
      list = await Listing.find({ status: "Approve"});
      console.log(list)
    }

    console.log(req.user)
    
    
    let data=req.user;
    console.log(data);
    if(data==undefined){
      
      data=null
    }
  let ads;
    if(req.session.item){
      let adss=Ads.find({productname:req.session.item}).populate("Productid").then((ad)=>{
       console.log(ad)
       ads=ad;
       res.json( { list, data,ads })
      })
   }
   else{
    req.session.item="null";
    ads=[];
    res.json( { list, data,ads })
  }
   }))
  
  //show page
  app.get('/listings/:id', pass.authenticate("jwt",{session:false}), wrapAsync(async (req, res) => {
    let user=req.user;
  let bidings;
    let { id } = req.params;
    let listing = await Listing.findById(id);
    console.log(listing)
    let bids = await biding.find({ "Productid": id }).populate("Productid").then((bid) => {
      console.log("this is bids")
      bidings=bid;
    })
    let users= await Listing.findById(id).populate("User").then((data) => {
      console.log("userrrrrrrr" + data)
      let name=data.name;
      console.log("pppppp"+name);
      //let ads=Ads.find({productname:name}).then((data)=>{
        //console.log("user ads data.................."+data)
        req.session.item=name;
      //})
       //let item=data.image[0].url;
       //req.session.item=item;
       
      //  res.json(listing)

      res.json({ listing, data ,bidings,user})
  
    });
  
    // console.log(listing.bidings)
  
    // let newListing= new Listing({...req.body.listing})
    // newListing.save();
  }));


  ///bidings
app.post("/listings/bidings/:id",pass.authenticate("jwt",{session:false}), wrapAsync(async (req, res) => {
  let userid = req.user._id;
  console.log(req.body)
  let d;
  let info;
  // let User = Users.findById(req.params.userid).then((data) => {
    d = req.user;
  // })
  let listing = await Listing.findById(req.params.id).then((ListingData)=>{
info=ListingData;
  })
  let id = req.params.id
  // let bidings = req.body;
  let {bidamounts,messages,buyers,contacts,sellers}=req.body
  console.log(bidamounts,messages,buyers,contacts,sellers)
  let newbidings = new biding({bidamount:bidamounts,message:messages,buyer:buyers,contact:contacts,seller:sellers, d,listing});
  newbidings.User.push(d);
  newbidings.Productid=info;

  console.log(newbidings)
  // listing.bidings.push(newbidings);
  await newbidings.save()
  // await listing.save()
  // res.redirect(`/listings/${id}`)
  res.json("bids add completed")
}))

// PROFILE..................................................................................................................................

app.get("/user/products",pass.authenticate("jwt",{session:false}),wrapAsync(async (req, res) => {
  let userid = req.user._id;
  let user = req.user;

  let product = Listing.find({ "User": userid }).then((data) => {
    console.log(data)
    // res.render("product.ejs", { userid, data })
    res.json( { userid, data,user })

  })
}));

app.get("/user/mybids",pass.authenticate("jwt",{session:false}),wrapAsync(async (req, res) => {
  let userid = req.user._id;
  let user;
    Users.findById(userid).then((users)=>{
      console.log(users)
      user=users
    });
  let bids = await biding.find({ "User": userid }).populate({
    path: 'Productid',
    populate: { path: 'User' }
 }) .populate('User') 
  .then((bid) => {
    console.log(bid);
    
    // res.render("mybid.ejs", { bid,user })
        res.json({ bid,user })


  })


}))
//show bids
app.get("/showbids/:id",pass.authenticate("jwt",{session:false}),wrapAsync(async(req,res)=>{
  let {id}=req.params;
  let user=req.user;
  let listing = await biding.find({"Productid":id }).populate({
    path: 'Productid',
    populate: { path: 'User' }
 }) .populate('User') .then((data)=>{
    console.log(data)
    // res.render("showbids.ejs",{data})
      res.json({data,user})

  });
}))

app.get("/user/general",pass.authenticate("jwt",{session:false}), wrapAsync( async(req, res) => {
  let id=req.user._id;
  await Users.findById(id).then((data)=>{
  console.log(data)
  // res.render("general.ejs",{data})
  res.json({data})

  })
  
}))
//upload image
app.post('/upload',pass.authenticate("jwt",{session:false}),upload.single('file'), wrapAsync(async (req, res) => {
  console.log(req.file.filename+","+req.file.path)
  let filename=req.file.filename;
  let url=req.file.path;
    let id = req.user._id;
    
    
  
    let newListing =  await Users.findByIdAndUpdate(id)

    newListing.image={url,filename}
  newListing.save()
// res.redirect(`/user/general`)    
 res.json("image upload completed")    

  }))
//admin //
  app.get("/products",pass.authenticate("jwt",{session:false}),wrapAsync( async (req, res) => {
    let user=req.user;
    let product = await Listing.find().populate("User").then((data) => {
      console.log(data)
      // res.render("admin.ejs", {data})
      res.json({data,user})

    });
  
  }))
  
  app.put("/approve/:_id",pass.authenticate("jwt",{session:false}),wrapAsync(async (req, res) => {
    let { _id } = req.params;
    
    console.log(_id)
    let product = await Listing.findByIdAndUpdate(_id, { status: "Approve" }).then((data) => {
      console.log(data)
      // res.redirect(`/products`)
           res.json("approve this item")

    })
  
  }))
  app.put("/reject/:_id/",pass.authenticate("jwt",{session:false}), wrapAsync(async (req, res) => {
    let { _id } = req.params;
    console.log(_id)
    let product = await Listing.findByIdAndUpdate(_id, { status: "Reject" }).then((data) => {
      console.log(data)
      // res.redirect(`/products`)
      res.json("reject this item")
    })
  
  }))


//user data for admin side
app.get("/userdata",pass.authenticate("jwt",{session:false}),  wrapAsync(async(req,res)=>{
  let user =req.user;
  let users= await Users.find({role:"User"}).then((data)=>{
    console.log(data)
    // res.render("users.ejs",{data})
       res.json({data,user})

  })
}))


//block user and user all listings for admin
app.put("/block/:_id/",pass.authenticate("jwt",{session:false}),wrapAsync(async (req, res) => {
  let {_id} = req.params;
  console.log(_id)
  let product = await Users.findByIdAndUpdate(_id, { status: "Block" }).then((data) => {
    // let bids = Listing.findOneAndUpdate({ "User": _id },{status:"block"}).then((bid) => {
    //   console.log(bid);  
    // })
    let bids = Listing.updateMany({ "User": _id }, { $set: { status: 'block'} }).then((bid) => {
      console.log(bid);  
    })
    console.log(data)
    // res.redirect("/userdata")
         res.json("user is block")

  })

}))
app.put("/unblock/:_id/",pass.authenticate("jwt",{session:false}),wrapAsync(async (req, res) => {
  let {_id} = req.params;
  console.log(_id)
  let product = await Users.findByIdAndUpdate(_id, { status: "Active" }).then((data) => {
    // let bids = Listing.findOneAndUpdate({ "User": _id },{status:"block"}).then((bid) => {
    //   console.log(bid);  
    // })
    let bids = Listing.updateMany({ "User": _id }, { $set: { status: 'pending'} }).then((bid) => {
      console.log(bid);  
    })
    console.log(data)
    // res.redirect("/userdata")
         res.json("user is unblock")

  })

}))

app.post("/ads/:productid/:productname",pass.authenticate("jwt",{session:false}),wrapAsync((req,res)=>{
  let productid=req.params.productid;
  let productname=req.params.productname;
  
 let newads = new Ads({productname:productname,Productid:productid})
  newads.save()
  // res.redirect("/user/products")
     res.json("ads add")

}))
  app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"somethig went wrong please try again"))
  })
  

      app.use((err,req,res,next)=>{
        let {statusCode=500,message="somethings went wrong"}=err;
        //react
          // res.status(statusCode).render("error.ejs",{message});
          res.json({error:message})
      // res.status(statusCode).json({message});
      })
      
      
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })