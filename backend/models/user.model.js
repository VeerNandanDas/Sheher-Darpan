import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email : { 
        type: String,
        required: true,
        unique: true,
    },
    password : {
        type: String,
    },
    name : {
        type: String,
        required: true,
    },
    phone : {
        type : String,
    },
    badges : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Badge",
    }]
})