import mongoose from "mongoose";
 let userSchema =new mongoose.Schema({
    fullname:{type:String,required:true},
    email: {type: String,required: true,unique:true },
    password: {type: String,required: true},
    bio: {type: String,default:'hii there,i am using quickchat'},
    profilePic: {type: String,default:''},
   lastSeen: { type: Date, default: null },
 },{timestamps:true})
  let userModel= mongoose.models.user || mongoose.model('user', userSchema);
  export default userModel;