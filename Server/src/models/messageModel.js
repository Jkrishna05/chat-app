import mongoose from "mongoose";
 let messageSchema =new mongoose.Schema({
     senderId:{type: mongoose.Schema.Types.ObjectId,ref:'user',required:true},
      reciverId:{type: mongoose.Schema.Types.ObjectId,ref:'user',required:true},
      text:{type:String},
      image:{type:String},
      seen:{type:Boolean,default:false}

 },{timestamps:true})
  let messageModel= mongoose.models.message || mongoose.model('message', messageSchema);
  export default messageModel;