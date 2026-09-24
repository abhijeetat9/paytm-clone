const express = require('express');
const zod = require('zod');
const { User, Account, RefreshToken} = require("../db/models");
const jwt = require("jsonwebtoken");
const config = require('../config');
const { hashPassword, verifyPassword, generateRefreshToken, hashToken} = require("../utils");
const useMiddleware = require("../middleware/auth");
const rateLimit = require('../middleware/rateLimiter');
const router = express.Router();
const logger = require('../logger');

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

const paginationSchema = zod.object({
    page: zod.coerce.number().int().positive().optional().default(1),
    limit: zod.coerce.number().int().positive().max(100).optional().default(10),
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

        const token = jwt.sign({ userId: user._id }, config.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN});
        const refreshToken = generateRefreshToken();
        const refreshTokenHash = hashToken(refreshToken);
        
        const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
        
        await RefreshToken.create({
            userID: user._id,
            tokenHash: refreshTokenHash,
            expiresAt
        });
        
        res.json({ message: "User created successfully", token, refreshToken });
    } catch (e) {
        logger.error({
            err: e,
            username: req.body.username
        }, "Signup failed");
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

        const token = jwt.sign({ userId: user._id }, config.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN});

        const refreshToken = generateRefreshToken();
        const refreshTokenHash = hashToken(refreshToken);

        const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

        await RefreshToken.create({
            userID: user._id,
            tokenHash: refreshTokenHash,
            expiresAt
        });
        res.status(200).json({ token, refreshToken, firstName: user.firstName });
    } catch (e) {
        logger.error({
            err: e,
            username: req.body.username
        }, "Signin failed");
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ message: "missing token" });
    }
    const tokenHash = hashToken(refreshToken);
    const storedToken = await RefreshToken.findOne({ tokenHash });
    if (!storedToken || storedToken.revoked || new Date() > storedToken.expiresAt) {
        return res.status(401).json({ message: "Invalid refresh token" });
    }
    const token = jwt.sign({ userId: storedToken.userID }, config.JWT_SECRET, 
        {expiresIn: process.env.JWT_EXPIRES_IN});
    
    storedToken.revoked = true;
    await storedToken.save();
    
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
    
    await RefreshToken.create({
        userID: storedToken.userID,
        tokenHash: newRefreshTokenHash,
        expiresAt
    });
    
    res.json({ token, refreshToken: newRefreshToken });
});

router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ message: "missing token" });
    }
    
    const tokenHash = hashToken(refreshToken);
    const storedToken = await RefreshToken.findOne({ tokenHash });
    if (storedToken) {
        storedToken.revoked = true;
        await storedToken.save();
    }
    res.json({message: "Logged out" });
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
    
    const parsed = paginationSchema.safeParse(req.query);
    const { page, limit } = parsed.data;
    const skip = (page - 1) * limit;
    
    const searchFilter = {
        $or: [
            { firstName: { $regex: filter, $options: 'i' } },
            { lastName: { $regex: filter, $options: 'i' } },
        ]
    }
    const users = await User.find(searchFilter).skip(skip).limit(limit);

    const total = await User.countDocuments(searchFilter);
    
    res.status(200).json({
        users: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id,
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
});

module.exports = router;
