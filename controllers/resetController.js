const bcrypt = require("bcrypt");
const sib = require("sib-api-v3-sdk");
const uuid = require("uuid");

//importing models
const User = require("../models/userModel");
const ForogotPassword = require("../models/passwordResetModel");

// Initialize the SendinBlue API client
const defaultClient = sib.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

const transacEmailApi = new sib.TransactionalEmailsApi();

/**
 * Function to send a password reset email using SendinBlue.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const uuidToken = uuid.v4(); // Generate a unique token

        // Save the reset request in the database
        const createRequest = await ForogotPassword.create({
            uuid: id,
            isActive: true,
            UserId: check.dataValues.id,
        });

        // Compose and send the email using SendinBlue
        const sender = new sib.SendSmtpEmailSender();
        sender.email = "hr@recur.com";
        sender.name = "HR";

        const to = [new sib.SendSmtpEmailTo()];
        to[0].email = email;

        const sendSmtpEmail = new sib.SendSmtpEmail();
        sendSmtpEmail.sender = sender;
        sendSmtpEmail.to = to;
        sendSmtpEmail.subject = "Password Reset Request";
        sendSmtpEmail.textContent = `Click the following link to reset your password: 
    http://43.205.233.208:3000/reset-password/${uuidToken}`;

        const sendEmailResponse = await transacEmailApi.sendTransacEmail({
            sendSmtpEmail,
        });

        res.status(200).json({
            success: true,
            message: "Email sent successfully",
        });
    } catch (error) {
        console.error("Error in sending password reset email:", error);
        res.status(500).json({
            success: false,
            message: "Email cannot be sent",
        });
    }
};

/**
 * Function to render a reset password form.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.resetPassword = async (req, res, next) => {
    const id = req.params.id;
    const user = await ForogotPassword.findOne({ where: { uuid: id } });
    if (user.dataValues.isActive) {
        await ForogotPassword.update(
            { isActive: false },
            { where: { uuid: id } }
        );
        res.status(200).send(`<html>
      <script>
      function formsubmitted(e){
        e.preventDefault();
        console.log('called')
        }
        </script>
        <form action="/password/update-password/${id}" method="get">
            <label for="newPassword">Enter New password</label>
            <input name="newPassword" type="password" required></input>
            <button>reset password</button>
        </form>
    </html>`);
        return res.end();
    } else {
        res.json({
            message: "Ivalid Link",
        });
    }
};

/**
 * Function to update the password.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
exports.updatePassword = async (req, res, next) => {
    const { newPassword } = req.query;
    const { id } = req.params;
    const passwordRequest = await ForogotPassword.findOne({
        where: { uuid: id },
    });
    const requestedUser = await User.findOne({
        where: { id: passwordRequest.dataValues.UserId },
    });
    if (requestedUser) {
        const saltRounds = 10;
        bcrypt.hash(newPassword, saltRounds, async (err, hash) => {
            if (err) {
                console.log(err);
                return;
            }
            const updatedPassword = requestedUser.update({
                password: hash,
            });
        });
    }
    res.status(200).json({ success: true });
};
