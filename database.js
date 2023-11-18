import mongoose from "mongoose";

const MONGO_URI = 'mongodb://127.0.0.1:27017/todoApp';

export const connectDatabase = async () => {
    try {
        const { connection } = await mongoose.connect(MONGO_URI)
        console.log(`MongoDB connected : ${connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}