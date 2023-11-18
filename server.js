import { app } from "./app.js";
import { config } from 'dotenv';
import { connectDatabase } from "./database.js";
import cloudinary from 'cloudinary';

// dotevn config
config({
    path: './config/config.env'
});

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

// Database Connection
connectDatabase();

app.listen(process.env.PORT, () => {
    console.log("server is running on port " + process.env.PORT)
})