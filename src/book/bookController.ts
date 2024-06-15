import path from "node:path";
import fs from "node:fs";
import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import { AuthRequest } from "../middlewares/authenticate";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, genre } = req.body;
        //console.log("files", req.files);

        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };

        const coverImageMimeType = files.coverImage[0].mimetype
            .split("/")
            .at(-1);

        const fileName = files.coverImage[0].filename;

        const filePath = path.resolve(
            __dirname,
            "../../public/data/uploads",
            fileName
        );

        const uploadResult = await cloudinary.uploader.upload(filePath, {
            filename_override: fileName,

            folder: "book-covers",

            format: coverImageMimeType,
        });

        const bookFileName = files.file[0].filename;

        const bookFilePath = path.resolve(
            __dirname,
            "../../public/data/uploads",
            bookFileName
        );

        const bookFileUploadResult = await cloudinary.uploader.upload(
            bookFilePath,
            {
                resourse_type: "raw",

                filename_override: bookFileName,

                folder: "book-pdfs",

                format: "pdf",
            }
        );

        const _req = req as AuthRequest;

        const newBook = await bookModel.create({
            title,
            genre,
            author: _req.userId,
            coverImage: uploadResult.secure_url,
            file: bookFileUploadResult.secure_url,
        });

        //Delete temp files
        try {
            await fs.promises.unlink(filePath);
            await fs.promises.unlink(bookFilePath);
        } catch (err) {
            console.log(err);
            return next(
                createHttpError(500, "Error while deleting temporary files")
            );
        }

        res.status(201).json({ id: newBook._id });
    } catch (err) {
        console.log(err);
        return next(
            createHttpError(500, "Error while uploading file to cloudinary")
        );
    }
};

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
    const { title, description, genre } = req.body;
    const bookId = req.params.bookId; // req.params me dynamic url ka part aata hai

    // check kara ki kya koi aisi book hai database me
    const book = await bookModel.findOne({ _id: bookId });

    // agar aisi koi book nahi hai to return ho jaao yahi se
    if (!book) {
        return next(createHttpError(404, "Book not found"));
    }

    //check karo ki jo book ko update kar raha hai kya wahi uska author hai
    const _req = req as AuthRequest;
    if (book.author.toString() !== _req.userId) {
        return next(createHttpError(403, "You can not update others book."));
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // check if image field is exists.
    let completeCoverImage = "";
    if (files.coverImage) {
        const filename = files.coverImage[0].filename;

        const converMimeType = files.coverImage[0].mimetype.split("/").at(-1);

        const filePath = path.resolve(
            __dirname,
            "../../public/data/uploads/" + filename
        );

        completeCoverImage = filename;

        const uploadResult = await cloudinary.uploader.upload(filePath, {
            filename_override: completeCoverImage,
            folder: "book-covers",
            format: converMimeType,
        });

        //cloudinary se wo image ka url le liya
        completeCoverImage = uploadResult.secure_url;

        //local file se image delete kar diya
        await fs.promises.unlink(filePath);
    }

    // check if file field is exists.
    let completeFileName = "";

    if (files.file) {
        const bookFilePath = path.resolve(
            __dirname,
            "../../public/data/uploads/" + files.file[0].filename
        );

        const bookFileName = files.file[0].filename;

        completeFileName = bookFileName;

        const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
            resource_type: "raw",
            filename_override: completeFileName,
            folder: "book-pdfs",
            format: "pdf",
        });

        completeFileName = uploadResultPdf.secure_url;

        await fs.promises.unlink(bookFilePath);
    }

    const updatedBook = await bookModel.findOneAndUpdate(
        {
            _id: bookId,
        },
        {
            title: title,
            description: description,
            genre: genre,
            coverImage: completeCoverImage
                ? completeCoverImage
                : book.coverImage,
            file: completeFileName ? completeFileName : book.file,
        },
        { new: true }
    );

    res.json(updatedBook);
};

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const book = await bookModel.find();

        res.json(book);
    } catch (err) {
        return next(createHttpError(500, "Error while getting a book"));
    }
};

const getSingleBook = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const bookId = req.params.bookId;

    try {
        const book = await bookModel.findOne({ _id: bookId });

        if (!book) {
            return next(createHttpError(404, "Book not found."));
        }

        return res.json(book);
    } catch (err) {
        return next(createHttpError(500, "Error while getting a book"));
    }
};

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
    const bookId = req.params.bookId;

    const book = await bookModel.findOne({ _id: bookId });

    if (!book) {
        return next(createHttpError(404, "Book not found"));
    }

    //Check Access
    const _req = req as AuthRequest;
    if (book.author.toString() !== _req.userId) {
        return next(createHttpError(403, "You can not delete others book."));
    }

    const coverFileSplits = book.coverImage.split("/");

    const coverImagePublicId =
        coverFileSplits.at(-2) +
        "/" +
        coverFileSplits.at(-1)?.split(".").at(-2);

    const bookFileSplits = book.file.split("/");

    const bookFilePublicId =
        bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);

    try {
        await cloudinary.uploader.destroy(coverImagePublicId);

        await cloudinary.uploader.destroy(bookFilePublicId, {
            resource_type: "raw",
        });
    } catch (err) {
        return next(
            createHttpError(
                500,
                "Error while deleting the file from cloudinary"
            )
        );
    }

    await bookModel.deleteOne({ _id: bookId });

    //During deletion we generally do not send any data
    return res.sendStatus(204);
};

export { createBook, updateBook, listBooks, getSingleBook, deleteBook };
