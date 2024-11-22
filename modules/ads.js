const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adsSchema = new Schema({
    
    // price: {
    //     type:Number,
    //   },
      
    //   description: {
    //     type:String,

    //   },
      Productid:{
        type:Schema.Types.ObjectId,
        ref:"Listing"
      },
     status:{
      type:String,
  default:"Active"

     }
//  image: [{
//         url:String,
//         filename:String
// }],
   });
  
module.exports= mongoose.model("Ads", adsSchema);
