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

        return res.json({
            accessToken: token,
        });
    } catch (err) {
        return next(createHttpError(500, "Error while signing jwt token"));
    }
};

export { createUser };
