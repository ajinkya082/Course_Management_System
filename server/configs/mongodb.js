import mongoose from "mongoose";

//Connect to mongoDB database

const connectDB =  async () =>{
    mongoose.connection.on('connected',() =>console.log('Database Connected'))

    await mongoose.connect(`${process.env.MONGO_URI}/learnifyDB`)
}
export default connectDB