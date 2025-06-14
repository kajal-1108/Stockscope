require("dotenv").config();

const express = require("express");
const app = express();
const flash = require("connect-flash")
const mongoose = require("mongoose");
const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt"); // For password comparison
const jwt = require("jsonwebtoken"); // For generating tokens

const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./schemas/user");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const PORT = process.env.PORT || 3001;
const uri = process.env.MONGO_URI;



const allowedOrigins = [
 "http://localhost:3000","http://localhost:3001"
];


app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
}));

app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));


const JWT_SECRET = "Mysecretecode";

const sessionOptions = {
  secret: "Mysecretecode",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: uri,
    touchAfter: 24 * 3600, // Optional
  }),
  cookie: {
    secure: process.env.NODE_ENV === "Production",         // ⬅️ Required for Render (HTTPS)
    httpOnly: true,
    sameSite: "none",     // ⬅️ Required for cross-site cookie (Vercel)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  }
};

app.set("trust proxy", 1); // ⬅️ Add this line above `app.use(session(...))`

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());



passport.use(User.createStrategy());



 passport.serializeUser(User.serializeUser());
 passport.deserializeUser(User.deserializeUser());


app.use(flash());


mongoose
  .connect(uri)
  .then(() => console.log("DB Connected!"))
  .catch((err) => console.error("DB Connection Failed:", err));


  app.use((req, res, next) => {
    console.log("Session details:", req.session);
    console.log("Authenticated user:", req.user);
    next();
});


// SIGNUP ROUTE
app.post("/signup", async (req, res) => {
  try {
      const { name, email, password } = req.body;

      // Validate inputs
      if (!name || !email || !password) {
          return res.status(400).json({ message: "All fields are required" });
      }

      // Ensure email is unique
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(400).json({ message: "Email already registered" });
      }

      // Create user
      const newUser = new User({ name, email });
      const registeredUser = await User.register(newUser, password);

      console.log("Registered User:", registeredUser);

      // Automatically login user
      req.login(registeredUser, (err) => {
          if (err) {
              console.error("Login error:", err);
              return res.status(500).json({ message: "Signup successful, but login failed" });
          }

          res.status(200).json({
              message: "Signup successful",
              redirectUrl: "http://localhost:3001/dashboard",
              user: { name: registeredUser.name, email: registeredUser.email },
          });
      });
  } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ message: "Signup failed", error: err.message });
  }
});



// Ensure correct path


app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("Email from request:", email);
        console.log("Password from request:", password);

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "User not found!" });
        }

        // Manually verify password using Passport-Local-Mongoose method
        user.authenticate(password, (err, authenticatedUser, passwordError) => {
            if (err) {
                console.error("Error during authentication:", err);
                return res.status(500).json({ message: "Internal server error" });
            }
            if (!authenticatedUser) {
                console.log("Authentication failed:", passwordError);
                return res.status(401).json({ message: passwordError.message || "Invalid credentials" });
            }

            console.log("User authenticated successfully:", authenticatedUser);
            req.login(authenticatedUser, (err) => {
                if (err) {
                    console.error("Error during session login:", err);
                    return res.status(500).json({ message: "Login failed" });
                }

                // Send redirect URL to frontend
                return res.status(200).json({
                    message: "Login successful",
                    redirectUrl: "http://localhost:3001/dashboard", // Redirect to dashboard folder
                    user: { name: authenticatedUser.name, email: authenticatedUser.email }
                });
            });
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


app.post("/logout", (req, res) => {
  req.logout((err) => {
      if (err) {
          return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy((err) => {
          if (err) {
              return res.status(500).json({ message: "Error clearing session" });
          }
          res.clearCookie("connect.sid"); // Session cookie delete karega
          return res.status(200).json({ message: "Logout successful" });
      });
  });
});


// GET ALL HOLDINGS
app.get("/allHoldings", async (req, res) => {
  try {
    let allHoldings = await HoldingsModel.find({});
    res.status(200).json(allHoldings);
  } catch (error) {
    console.error("Error fetching holdings:", error);
    res.status(500).json({ message: "Error fetching holdings", error });
  }
});

// GET ALL POSITIONS
app.get("/allPositions", async (req, res) => {
  try {
    let allPositions = await PositionsModel.find({});
    res.status(200).json(allPositions);
  } catch (error) {
    console.error("Error fetching positions:", error);
    res.status(500).json({ message: "Error fetching positions", error });
  }
});

// PLACE A NEW ORDER
app.post("/newOrder", async (req, res) => {
  try {
    const { name, qty, price, mode } = req.body; // mode can be "BUY" or "SELL"

    // Save the order in the orders collection
    const newOrder = new OrdersModel({
      name,
      qty,
      price,
      action: mode, // BUY or SELL
      date: new Date(),
    });
    await newOrder.save();

    // Update holdings based on mode
    if (mode === "BUY") {
      // Check if the stock is already in holdings
      const existingHolding = await HoldingsModel.findOne({ name });
      if (existingHolding) {
        // Update existing holding
        const totalQty = existingHolding.qty + qty;
        const newAvgPrice =
          (existingHolding.avg * existingHolding.qty + price * qty) / totalQty;
        existingHolding.qty = totalQty;
        existingHolding.avg = newAvgPrice;
        await existingHolding.save();
      } else {
        // Create new holding
        const newHolding = new HoldingsModel({
          name,
          qty,
          avg: price,
        });
        await newHolding.save();
      }
    } else if (mode === "SELL") {
      const existingHolding = await HoldingsModel.findOne({ name });
      if (existingHolding) {
        existingHolding.qty -= qty;
        if (existingHolding.qty <= 0) {
          // Remove the holding if quantity becomes 0
          await HoldingsModel.deleteOne({ name });
        } else {
          await existingHolding.save();
        }
      }
    }

    res.status(200).json({ message: "Order placed successfully!" });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Error placing order", error });
  }
});

// DELETE A HOLDING
app.delete("/deleteHolding/:id", async (req, res) => {
  try {
    const holdingId = req.params.id;
    const deleted = await HoldingsModel.findByIdAndDelete(holdingId);
    if (deleted) {
      res.status(200).json({ message: "Holding deleted successfully" });
    } else {
      res.status(404).json({ message: "Holding not found" });
    }
  } catch (error) {
    console.error("Error deleting holding:", error);
    res.status(500).json({ message: "Error deleting holding", error });
  }
});




app.get("/currentUser", (req, res) => {

  console.log("Session details:", req.session);
  console.log("Authenticated user:", req.user);


  if (req.isAuthenticated()) {
    const { name, email } = req.user
    res.status(200).json({ user: { name, email} });
  } else {
    res.status(401).json({ message: "User not authenticated" });
  }
});


// GET ALL ORDERS
app.get("/orders", async (req, res) => {
  try {
    const orders = await OrdersModel.find().sort({ date: -1 }); // Sort by latest order
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders", error });
  }
});


app.get("/api/summary", (req, res) => {
  
  

  res.json({
    username: "kajal", // 👈 logged-in user ka name yahan se milega
    marginAvailable: 3.74,
    marginsUsed: 0,
    openingBalance: 3.74,
    holdingsCount: 13,
    profitLoss: 1.55,
    profitPercentage: 5.2,
    currentValue: 31.43,
    investment: 29.88,
  });
});



app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});  