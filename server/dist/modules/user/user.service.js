"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateUser = exports.getUserByEmail = exports.getUserById = exports.getAllUsers = exports.createUser = void 0;
const user_model_1 = require("./user.model");
// Create User
const createUser = async (user) => {
    const newUser = new user_model_1.UserModel(user);
    return await newUser.save();
};
exports.createUser = createUser;
// Get All Users
const getAllUsers = async () => {
    return await user_model_1.UserModel.find();
};
exports.getAllUsers = getAllUsers;
// Get Single User
const getUserById = async (id) => {
    return await user_model_1.UserModel.findById(id);
};
exports.getUserById = getUserById;
// Get User by Email
const getUserByEmail = async (email) => {
    return await user_model_1.UserModel.findOne({ email });
};
exports.getUserByEmail = getUserByEmail;
// activate User
const activateUser = async (id, updateData) => {
    const updatedUser = await user_model_1.UserModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedUser) {
        throw new Error('User not found');
    }
    return updatedUser;
};
exports.activateUser = activateUser;
