// Importing models and libraries
const Expense = require("../models/expenseModel");
const User = require("../models/userModel");
const sequelize = require("../utilities/database");

/**
 * Middleware to save an expense to the database.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.saveDataToDatabase = async (req, res, next) => {
    const t = await sequelize.transaction();
    console.log(req.body, req.user);
    try {
        const data = await Expense.create(
            {
                description: req.body.description,
                price: req.body.amount,
                category: req.body.category,
                UserId: req.user.id,
            },
            { transaction: t }
        );
        const check = await User.update(
            {
                totalExpense: sequelize.literal(
                    `totalExpense + ${req.body.amount}`
                ),
            },
            { where: { id: req.user.id }, transaction: t }
        );
        await t.commit();
        res.status(201).json(data);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: "Error Adding Expense To The Database" });
    }
};

/**
 * Middleware to delete an expense from the database.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.deleteFromDatabase = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const id = req.params.id;
        const price = await Expense.findOne(
            {
                where: { id: id },
                attributes: ["price"],
            },
            { transaction: t }
        );
        const deletionAmount = price.dataValues.price;
        const data = await Expense.destroy(
            { where: { id: id } },
            { transaction: t }
        );
        const check = await User.update(
            {
                totalExpense: sequelize.literal(
                    `totalExpense - ${deletionAmount}`
                ),
            },
            { where: { id: req.user.id }, transaction: t }
        );
        await t.commit();
        res.status(200).json({ message: "Deletion successful" });
    } catch (error) {
        await t.rollback();
        res.status(500).json({
            error: "Error Deleting Data From the Data Base",
        });
    }
};

/**
 * Middleware to edit an expense in the database.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.editDataInDatabase = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const id = req.params.id;

        const oldP = await Expense.findOne(
            {
                where: { id: id },
                attributes: ["price"],
            },
            { transaction: t }
        );
        const oldPrice = oldP.dataValues.price;
        const newPrice = req.body.price;
        const effectivePrice = oldPrice - newPrice;
        const data = await Expense.update(
            {
                description: req.body.description,
                price: req.body.price,
                category: req.body.category,
            },

            { where: { id: id }, transaction: t }
        );
        const check = await User.update(
            {
                totalExpense: sequelize.literal(
                    `totalExpense - ${effectivePrice}`
                ),
            },
            { where: { id: req.user.id }, transaction: t }
        );

        const updatedData = await Expense.findByPk(id, { transaction: t });
        await t.commit();
        res.status(200).json(updatedData.dataValues);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: "Error Editing Data from the Database" });
    }
};

/**
 * Middleware to get all expenses from the database.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.getAllDataFromDatabase = async (req, res, next) => {
    try {
        console.log(req.user);
        const dbData = await Expense.findAll({
            where: { UserId: req.user.id },
        });
        const data = dbData.map((data) => data.dataValues);

        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({
            error: "Error retrieving all data from the database",
        });
    }
};

/**
 * Middleware to get paginated expenses from the database.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.getPaginatedData = async (req, res) => {
    console.log(req.query);
    const currentpage = JSON.parse(req.query.page) || 1;
    const limit = JSON.parse(req.query.count) || 3;
    const totalExpenses = await Expense.count({
        where: { UserId: req.user.id },
    });
    const pageData = await Expense.findAll({
        offset: (currentpage - 1) * limit,
        limit: limit,
        where: { UserId: req.user.id },
    });
    const responseData = {
        pageData: pageData,
        currentpage: currentpage,
        nextPage: currentpage + 1,
        hasNextPage: limit * currentpage < totalExpenses,
        previousPage: currentpage - 1,
        hasPreviousPage: currentpage > 1,
        lastPage: Math.ceil(totalExpenses / limit),
    };
    console.log(totalExpenses, responseData);
    res.status(200).json({
        success: true,
        message: "Succcessfully retrieved data.",
        data: responseData,
    });
};

/**
 * Middleware to add income to the user's profile.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */

exports.addIncome = async (req, res) => {
    try {
        const response = await User.update(
            {
                income: sequelize.literal(`income + ${req.body.amount}`),
            },
            {
                where: { id: req.user.id },
            }
        );
        console.log(response);
        res.status(200).json({
            success: true,
            message: "income added successfully",
            response,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error Adding Income",
        });
    }
};
