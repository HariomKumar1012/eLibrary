import express, { NextFunction, Request, Response } from "express";
import { HttpError } from "http-errors";
import { config } from "./config/config";
import globalErrorHandler from "./config/middlewares/globalErrorHandler";
import userRouter from "./user/userRouter";

const app = express();

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to E library",
    });
});

//user router
app.use("/api/users", userRouter);

//globle Error Handler
app.use(globalErrorHandler);

export default app;
