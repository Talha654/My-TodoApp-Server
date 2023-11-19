import mongoose from "mongoose";

// const MONGO_URI = 'mongodb+srv://talhaarain7870:password_123@cluster0.d9ht5le.mongodb.net/?retryWrites=true';

export const connectDatabase = async () => {
    try {
        const { connection } = await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDB connected : ${connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}