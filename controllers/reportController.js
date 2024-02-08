const Expense = require("../models/expenseModel");
const Reports = require("../models/fileReportsModel");

const AWS = require("aws-sdk");
const sequelize = require("../utilities/database");

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
});

/**
 * Upload data to AWS S3.
 * @param {Buffer | string} data - Data to be uploaded.
 * @param {string} name - Name of the file.
 * @returns {Promise<Object>} AWS S3 response.
 */
function uploadToS3(data, name) {
    const BUCKET_NAME = process.env.AWS_EXPENSE_FILE_BUCKET;
    const ACL_ACCESS = process.env.AWS_ACCESS_STATUS;
    const params = {
        Bucket: BUCKET_NAME,
        Key: name,
        Body: data,
        ACL: ACL_ACCESS,
    };
    return new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * Middleware function to download a report and store it in S3.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.downloadReport = async (req, res) => {
    const t = await sequelize.transaction();
    console.log(req.user);
    try {
        const userExpenses = await Expense.findAll(
            {
                where: { UserId: req.user.id },
            },
            { transaction: t }
        );
        const stringifiedData = JSON.stringify(userExpenses);
        const fileName = `Expenses_${req.user.id}_${new Date()} `;
        const fileURL = await uploadToS3(stringifiedData, fileName);
        await Reports.create(
            {
                fileUrl: fileURL.Location,
                UserId: req.user.id,
            },
            { transaction: t }
        );
        await t.commit();
        res.status(200).json({ fileURL: fileURL, success: true });
    } catch (err) {
        await t.rollback();
        console.log(err);
        res.status(500).json({ success: false });
    }
};

/**
 * Middleware function to show reports associated with the user.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.showReports = async (req, res) => {
    try {
        const response = await Reports.findAll({
            where: { UserId: req.user.id },
            attributes: ["fileUrl", "createdAt"],
        });
        res.status(200).json({
            success: true,
            message: "Succesfully retrieved files",
            response,
        });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};
