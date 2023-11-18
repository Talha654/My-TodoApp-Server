import { User } from "../models/Users.js";
import { sendMail } from "../utils/SendMail.js";
import { sendToken } from "../utils/sendToken.js";
import cloudinary from 'cloudinary';
import fs from 'fs';

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const avatar = req.files.avatar.tempFilePath;

        let user = await User.findOne({ email });
        if (user) {
            return res
                .status(400)
                .json({ success: false, message: "User already exists" });
        }
        const otp = Math.floor(Math.random() * 100000)

        const mycloud = await cloudinary.v2.uploader.upload(avatar);

        fs.rmSync("./tmp", { recursive: true });

        user = await User.create({
            name,
            email,
            password,
            avatar: {
                public_id: mycloud.public_id,
                url: mycloud.secure_url,
            },
            otp,
            otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000)
        });

        // await sendMail(email, "verify your account ", `your otp is ${otp}`);

        sendToken(res,
            user,
            201,
            "OTP send to your email,please verify your account");

    } catch (error) {
        res.status(500)
            .json({ success: false, message: error.message });
    }
};

export const verify = async (req, res) => {
    try {
        const otp = Number(req.body.otp);
        const user = await User.findById(req.user._id);

        if (user.otp != otp || user.otp_expiry < Date.now()) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid OTP or has been expired" });
        }


        user.verified = true;
        user.otp = null;
        user.otp_expiry = null;

        await user.save();

        sendToken(res, user, 200, "Account Verified")

    } catch (error) {
        res.status(500)
            .json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ success: false, message: "please enter all fields" });
        }
        // const { avatar } = req.files;
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "invalid Email or Password" });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "invalid Email or Password" });
        }
        // sendMyToken(
        //     res,
        //     user,
        //     200,
        //     "login succesfully");
        sendToken(res, user, 200, "Login Successful");
    } catch (error) {
        res.status(500)
            .json({ success: false, message: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        res.status(200).cookie("token", null, {
            expires: new Date(Date.now()),
        }).json({ status: true, message: "Logged out successfully" })
    } catch (error) {
        res.status(500)
            .json({ success: false, message: error.message });
    }
};


export const addTask = async (req, res) => {
    try {
        const { title, description } = req.body;
        const user = await User.findById(req.user._id);

        user.tasks.push({
            title,
            description,
            completed: false,
            createdAt: new Date(Date.now())
        });

        await user.save();
        res.status(200)
            .json({ success: true, message: "Task added succesfully" });
    } catch (error) {
        res.status(500)
            .json({ success: false, message: error.message });
    }
};


export const removeTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const user = await User.findById(req.user._id);

        user.tasks = user.tasks.filter(task => task._id.toString() != taskId.toString())

        await user.save();
        res.status(200)
            .json({ success: true, message: "Task removed succesfully" });
    } catch (error) {
        res.status(500)
            .json({ success: false, message: error.message });
    }
};

export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const user = await User.findById(req.user._id);

        user.task = user.tasks.find((task) => task._id.toString() == taskId.toString())
        user.task.completed = !user.task.completed
        await user.save();
        res.status(200)
            .json({ success: true, message: "Task updated succesfully" });
    } catch (error) {
        res.status(500)
            .json({ success: false, message: error.message });
    }
};
export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        sendToken(res, user, 200, `Welcome Back ${user.name}`)
    } catch (error) {
        res.status(500)
            .json({ success: false, message: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { name } = req.body;
        const avatar = req.files.avatar.tempFilePath;
        if (name) user.name = name;
        if (avatar) {

            await cloudinary.v2.uploader.destroy(user.avatar.public_id);

            const mycloud = await cloudinary.uploader.upload(avatar);

            fs.rmSync("./tmp", { recursive: true });

            user.avatar = {
                public_id: mycloud.public_id,
                url: mycloud.secure_url,
            }
        }
        await user.save();
        res.status(400)
            .json({ status: false, message: "profile updated successfully" });
    } catch (error) {
        res.status(500)
            .json({ success: false, message: error.message });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("+password");

        const { oldpassword, newpassword } = req.body;

        if (!oldpassword || !newpassword) {
            res.status(400)
                .json({ status: false, message: "please enter all fields" });
        }

        const isMatch = await user.comparePassword(oldpassword);

        if (!isMatch) {
            res.status(400)
                .json({ status: false, message: "Invalid Old Password" });
        }

        user.password = newpassword;

        await user.save();

        res.status(400)
            .json({ status: false, message: "password updated successfully" });

    } catch (error) {
        res.status(500)
            .json({ success: false, message: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {

        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400)
                .json({ status: false, message: "Invalid Email" });
        }
        const otp = Math.floor(Math.random() * 100000);

        user.resetpasswordotp = otp;
        user.resetpasswordotpExpiry = Date.now() + 10 * 60 * 1000;

        await user.save();

        const message = `Your OTP for reseting the password ${otp}.
         if you did not request for this,please ignore this email`

        sendMail(email, "Request for Reseting Password", message);

        res.status(200)
            .json({ status: true, message: `OTP sent to ${email}` });

    } catch (error) {
        res.status(500)
            .json({ success: false, message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {

        const { otp, newpassword } = req.body;
        const user = await User.findOne({
            resetpasswordotp: otp,
            resetpasswordotpExpiry: { $gt: Date.now() }
        });

        if (!user) {
            res.status(400)
                .json({ status: false, message: "OTP Invalid or has been expired" });
        }
        user.password = newpassword;
        user.resetpasswordotp = null;
        user.resetpasswordotpExpiry = null;

        await user.save();

        res.status(200)
            .json({ status: true, message: "Password changed successfully" });

    } catch (error) {
        res.status(500)
            .json({ success: false, message: error.message });
    }
};
