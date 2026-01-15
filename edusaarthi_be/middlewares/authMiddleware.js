const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-very-secure";

const protect = async (req, res, next) => {
    try {
        // 1) Get token from header
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                status: "fail",
                message: "You are not logged in"
            });
        }

        // 2) Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // 3) Check if user exists
        const currentUser = await User.findById(decoded.id);

        if (!currentUser) {
            return res.status(401).json({
                status: "fail",
                message: "User no longer exists"
            });
        }

        // 4) Attach user to request
        req.user = currentUser;

        // 5) Allow request to continue
        next();
    } catch (err) {
        res.status(401).json({
            status: "fail",
            message: "Invalid token or session expired"
        });
    }
};

module.exports = { protect };
