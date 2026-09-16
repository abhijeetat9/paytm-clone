const express = require('express');
const zod = require('zod');
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require('../config.js');
const { hashPassword, verifyPassword } = require("../utils");
const useMiddleware = require("../middleware");
const rateLimit = require('../rateLimiter');
const router = express.Router();

const signUpSchema = zod.object({
    username: zod.string(),
    password: zod.string().min(6),
    firstName: zod.string(),
    lastName: zod.string()
});

const signInSchema = zod.object({
    username: zod.string(),
    password: zod.string(),
});

const updateBody = zod.object({
    username: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
});

router.post('/signup', rateLimit, async (req, res) => {
    try {
        const { success } = signUpSchema.safeParse(req.body);
        if (!success) {
            return res.status(411).json({ message: "Invalid inputs" });
        }

        const existingUser = await User.findOne({ username: req.body.username });
        if (existingUser) {
            return res.status(411).json({ message: "Username already taken" });
        }

        const hashedPassword = await hashPassword(req.body.password);

        const user = await User.create({
            username: req.body.username,
            password: hashedPassword,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
        });

        await Account.create({
            userID: user._id,
            balance: 1 + Math.random() * 10000
        });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN});
        res.json({ message: "User created successfully", token });
    } catch (e) {
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/signin', rateLimit, async (req, res) => {
    try {
        const { success } = signInSchema.safeParse(req.body);
        if (!success) {
            return res.status(411).json({ message: "Invalid inputs" });
        }

        const user = await User.findOne({ username: req.body.username });
        if (!user) {
            return res.status(411).json({ message: "Error while logging in" });
        }

        const isValid = await verifyPassword(req.body.password, user.password);
        if (!isValid) {
            return res.status(411).json({ message: "Error while logging in" });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN});
        res.status(200).json({ token, firstName: user.firstName });
    } catch (e) {
        res.status(500).json({ message: "Internal server error" });
    }
});

router.put('/', useMiddleware, async (req, res) => {
    const { success } = updateBody.safeParse(req.body);
    if (!success) {
        return res.status(411).json({ message: "Error while updating information" });
    }
    await User.updateOne({ _id: req.userId }, req.body);
    res.status(200).json({ message: "Successfully updated user" });
});

router.get('/bulk', useMiddleware, async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [
            { firstName: { $regex: filter, $options: 'i' } },
            { lastName: { $regex: filter, $options: 'i' } },
        ]
    });

    res.status(200).json({
        users: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id,
        }))
    });
});

module.exports = router;
