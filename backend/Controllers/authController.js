import User from "../models/userSchema.js";
import Admin from "../models/adminSchema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "5d",
    }
  );
};

// User registration
export const register = async (req, res, next) => {
    const us =  req.body;
    // console.log(us);
  const { email, password, name, role } = req.body;
  try {
    let user = null;
    if (role === "student") {
      user = await User.findOne({ email: email });
    } else if (role === "admin") {
      user = await Admin.findOne({ email: email });
    }

    // Check if user is already registered
    if (user) {
      return res.status(400).json({ message: `User already exists` });
    }
    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    if (role === "student") {
      user = new User({
        name,
        email,
        password: hashPassword,
        role,
      });
    }
    if (role === "admin") {
      user = new Admin({
        name,
        email,
        password: hashPassword,
        role,
      });
    }
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "User successfully created." });
  } catch (e) {
    // console.log(e);
    res
      .status(500)
      .json({ success: false, message: "Internal server error try again." });
  }
};

// User login
export const login = async (req, res, next) => {
  const { email } = req.body;
 
  try {
    let user = null;
    const student = await User.findOne({ email: email });
    const admin = await User.findOne({ email: email });
    if (student) {
      user = student;
    }
    if (admin) {
      user = admin;
    }
 
    // Check if user exist or not
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // compare password
    const isPasswordMatch = await bcrypt.compare(
      req.body.password,
      user.password
    ); //compare function take 2 parameter one is password provided by user(password) and another is password in DB(user.password)

    if (!isPasswordMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    // If password match then generate JWT token
    // get token
    const token = generateToken(user);
    

    // Login user
    const { password, role, ...rest } = user;
    res.status(400).json({
      success: true,
      message: "Successfully login",
      token,
      data: { ...rest },
      role,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to login" });
  }
};
