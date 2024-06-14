import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    //validation: Check kiya ki saara data user ne bheja hai ya nahi
    if (!name || !email || !password) {
        const error = createHttpError(400, "All fields are required");
        return next(error);
    }

    try {
        //Database call: Check kariye ki user already database me exist karta hai ya nahi
        const user = await userModel.findOne({ email: email });

        //Agar user already database me exist karta hai to user ko register mat kariye
        if (user) {
            const error = createHttpError(
                400,
                "User already exist with this email"
            );
            return next(error);
        }
    } catch (err) {
        return next(createHttpError(500, "Error while getting the user"));
    }

    //agar user new hai to use register karna hoga
    //User ko database me register karne ke liye sabse pehle uska password ko hash kariye
    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser: User;

    try {
        newUser = await userModel.create({
            name,
            email,
            password: hashedPassword,
        });
    } catch (err) {
        return next(createHttpError(500, "Error while creating the user"));
    }

    //JWT token generation
    //sub me hum user ki id daalenge which is going to used as a payload in the signature
    try {
        const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
            expiresIn: "7d",
        });

        return res.status(201).json({
            accessToken: token,
        });
    } catch (err) {
        return next(createHttpError(500, "Error while signing jwt token"));
    }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    //Validation
    if (!email || !password) {
        return next(createHttpError(400, "All fields are required"));
    }

    //check if user is registered or not
    let user;
    try {
        user = await userModel.findOne({ email: email });
        if (!user) {
            const error = createHttpError(404, "User not found");
            return next(error);
        }
    } catch (err) {
        return next(createHttpError(404, "Error while finding the user"));
    }

    //user mil gaya hai to check kariye ki password sahi enter kara hai ya nahi
    const isMatch = await bcrypt.compare(password, user.password as string);

    if (!isMatch) {
        return next(createHttpError(400, "Username or password incorrect"));
    }

    try {
        const token = sign({ sub: user._id }, config.jwtSecret as string, {
            expiresIn: "7d",
        });

        return res.status(201).json({
            accessToken: token,
        });
    } catch (err) {
        return next(createHttpError(500, "Error while signing jwt token"));
    }
};

export { createUser, loginUser };
