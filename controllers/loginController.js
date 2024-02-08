const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

/**
 * Middleware to handle user signup.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.signup = async (req, res, next) => {
    try {
        const saltRounds = 10;
        const password = req.body.password;
        bcrypt.hash(password, saltRounds, async (err, hash) => {
            if (err) {
                console.log(err);
                return;
            }
            const data = await User.findOrCreate({
                where: { email: req.body.email },
                defaults: {
                    userName: req.body.name,
                    email: req.body.email,
                    password: hash,
                },
            });
            if (data[1]) {
                res.status(200).json({
                    success: true,
                    message: "User created successfully",
                });
            } else {
                res.status(201).json({
                    success: true,
                    message: " User Already Exists",
                });
            }
        });
    } catch (err) {
        res.status(500).json({
            sucess: false,
            message: "Error Signing up user",
        });
    }
};

/**
 * Middleware to generate a JSON Web Token (JWT) for a user.
 * @param {object} user - User object.
 * @returns {string} JWT token.
 */
function generateAutheticationToken(data) {
    const id = data.id;
    const secretKey = process.env.JWT_SECRET_KEY;
    const token = jwt.sign(id, secretKey);
    return token;
}

/**
 * Middleware to handle user login.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.login = async (req, res, next) => {
    try {
        const data = await User.findAll({ where: { email: req.body.email } });
        if (data.length === 0) {
            res.status(404).json({ message: "User not found", success: false });
        } else {
            const jwtToken = generateAutheticationToken(data[0].dataValues);
            const inputCredentials = req.body;
            const databaseCredentials = data[0].dataValues;
            bcrypt.compare(
                inputCredentials.password,
                databaseCredentials.password,
                function (err, result) {
                    if (result) {
                        res.status(200).json({
                            message: "logged in successfully",
                            success: true,
                            encryptedId: jwtToken,
                            isPremium: data[0].dataValues.isPremium,
                        });
                    }
                    if (!result) {
                        if (
                            inputCredentials.email === databaseCredentials.email
                        ) {
                            res.status(401).json({
                                message: "password mismatch",
                                success: false,
                            });
                        } else {
                            res.status(404).json({ message: "User not found" });
                        }
                    }
                }
            );
        }
    } catch (error) {
        res.status(500).json({ error: "Error occured while logging In" });
    }
};
