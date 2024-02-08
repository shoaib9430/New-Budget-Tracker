const User = require("../models/userModel");
const sequelize = require("../utilities/database");

/**
 * Middleware to show the leaderboard.
 * @param {object} req - Express request object.ß
 * @param {object} res - Express response object.
 */
exports.showLeaderboard = async (req, res, next) => {
    try {
        const allUsers = await User.findAll({
            attributes: ["id", "userName", "totalExpense"],
        });
        const usersArray = allUsers.map((User) => ({
            data: User.dataValues,
        }));

        usersArray.sort((a, b) => b.data.totalExpense - a.data.totalExpense);
        console.log(usersArray);
        res.status(200).json({ success: true, leaderboardData: usersArray });
    } catch (error) {
        res.status(500).json({ error: "Error showing leaderboard" });
    }
};

/**
 * Middleware to show the user's dashboard.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.showDashboard = async (req, res) => {
    try {
        const response = await User.findOne({
            where: { id: req.user.id },
            attributes: ["income", "totalExpense"],
        });
        res.status(200).json({ success: true, data: response });
    } catch (error) {
        console.log("error showing dashboard");
        res.status(500).json({ error: "Error showing dashboard" });
    }
};
