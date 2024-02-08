// Importing necessary modules
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

// Importing routes
const loginRoutes = require("./routes/userRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const premiumRoutes = require("./routes/premiumRoutes");
const resetRoutes = require("./routes/passwordResetRoutes");
const sequelize = require("./utilities/database");
//importing models
const User = require("./models/userModel");
const Expense = require("./models/expenseModel");
const Order = require("./models/ordersModel");
const ReportFiles = require("./models/fileReportsModel");
const ForogotPassword = require("./models/passwordResetModel");
//table relations
User.hasMany(Expense);
Expense.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);

User.hasMany(ForogotPassword);
ForogotPassword.belongsTo(User);

User.hasMany(ReportFiles);
ReportFiles.belongsTo(User);

const app = express();

// Middleware setup
app.use(
    cors({
        origin: ["http://43.205.233.208:3000", "http://127.0.0.1:5500"],
    })
);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Defining routes
app.use("/user", loginRoutes);
app.use("/expense", expenseRoutes);
app.use("/purchase", purchaseRoutes);
app.use("/premium", premiumRoutes);
app.use("/password", resetRoutes);

// Serving static files from the 'public' directory
app.use((req, res) => {
    console.log(`Requested URL: ${req.url}`);
    res.sendFile(path.join(__dirname, `/public/${req.url}`));
});

sequelize.sync().then(() => {
    const port = process.env.PORT;
    console.log(`Server started at ${port}`);
    app.listen(port);
});
