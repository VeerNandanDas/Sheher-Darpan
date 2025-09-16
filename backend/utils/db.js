import mongoose from "mongoose"


const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sheherdarpan";

export const initDb = async ()=> {
    try{
        const connection = await mongoose.connect(mongoUri , {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        console.log(`Connected to MongoDB: ${connection.connection.host}`);
    }catch(error){
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}