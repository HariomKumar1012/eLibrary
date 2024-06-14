import express, { NextFunction, Request, Response } from "express";
import { HttpError } from "http-errors";
import { config } from "./config/config";
import globalErrorHandler from "./config/middlewares/globalErrorHandler";

const app = express();

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to E library",
    });
});

//globle Error Handler
app.use(globalErrorHandler);

export default app;
