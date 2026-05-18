import mongoose from "mongoose";
export let dbConnect=async()=>{
    try {
         if (!process.env.MONGO_DB) {
      throw new Error("⚠️ No MongoDB URI found in env file");
    }
        await mongoose.connect(process.env.MONGO_DB).then(()=>{console.log('Database connected');})
        
    } catch (error) {
        console.log(error);
    }
}