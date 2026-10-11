"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRefreshToken = exports.deleteRefreshToken = exports.findRefreshToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.storeRefreshToken = exports.generateToken = void 0;
const config_1 = require("../../config/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const refresh_model_1 = require("./refresh.model");
// Generate Access Token and Refresh Token
const generateToken = (payload) => {
    const accessToken = jsonwebtoken_1.default.sign(payload, config_1.config.accessTokenSecret, { expiresIn: '1h' });
    const refreshToken = jsonwebtoken_1.default.sign(payload, config_1.config.refreshTokenSecret, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};
exports.generateToken = generateToken;
// store refresh token in database
const storeRefreshToken = async (userId, refreshToken) => {
    try {
        await refresh_model_1.RefreshTokenModel.create({ userId, token: refreshToken });
    }
    catch (error) {
        throw error;
    }
};
exports.storeRefreshToken = storeRefreshToken;
// verify access token
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, config_1.config.accessTokenSecret);
};
exports.verifyAccessToken = verifyAccessToken;
// verify refresh token
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, config_1.config.refreshTokenSecret);
};
exports.verifyRefreshToken = verifyRefreshToken;
// DB Operations on refresh token
const findRefreshToken = async (userId, token) => {
    return await refresh_model_1.RefreshTokenModel.findOne({ userId, token });
};
exports.findRefreshToken = findRefreshToken;
const deleteRefreshToken = async (token) => {
    return await refresh_model_1.RefreshTokenModel.findOneAndDelete({ token });
};
exports.deleteRefreshToken = deleteRefreshToken;
const updateRefreshToken = async (userId, newToken) => {
    try {
        await refresh_model_1.RefreshTokenModel.updateOne({ userId }, { token: newToken }, { upsert: true });
    }
    catch (error) {
        throw error;
    }
};
exports.updateRefreshToken = updateRefreshToken;
