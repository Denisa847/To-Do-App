require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sql, config } = require("./db");

const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

transporter.verify((error, success) => {
  if (error) {
    console.log("MAIL VERIFY ERROR:", error)
  } else {
    console.log("Mail server is ready")
  }
})

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

sql.connect(config)
    .then(() => console.log("Connected to SQL Server"))
    .catch(err => console.log("Database connection error:", err));

app.get("/", (req, res) => {
    res.send("ToDo API is running");
});

app.get("/tasks", authMiddleware, async (req, res) => {
  try {
    console.log("Decoded token:", req.user);

    const result = await new sql.Request()
      .input("userId", sql.Int, req.user.id)
      .query(`
        SELECT *
        FROM Tasks
        WHERE user_id = @userId
        ORDER BY
          CASE WHEN deadline IS NULL THEN 1 ELSE 0 END,
          deadline ASC,
          CASE priority
            WHEN 'High' THEN 1
            WHEN 'Medium' THEN 2
            WHEN 'Low' THEN 3
            ELSE 4
          END
      `);

    console.log("Querying tasks for token user id:", req.user.id);
    console.log("Tasks returned:", result.recordset);

    res.json(result.recordset);
  } catch (error) {
    console.log("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
});


app.get("/task/:id",authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await new sql.Request()
            .input("id", sql.Int, id)
            .input("userId", sql.Int, req.user.id)
            .query("SELECT * FROM Tasks WHERE id = @id AND user_id = @userId");

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.log("Error fetching task:", error);
        res.status(500).json({ message: "Server error" });
    }
});


app.post("/tasks", authMiddleware,async (req, res) => {
    try {
        const { title, description, priority, deadline, status} = req.body;

         await new sql.Request()
            .input("title", sql.VarChar, title)
            .input("description", sql.VarChar, description || "")
            .input("priority", sql.VarChar, priority || "")
            .input("deadline", sql.Date, deadline || null)
            .input("status", sql.VarChar, status || "")
            .input("user_id", sql.Int, req.user.id)
            .query(`
                INSERT INTO Tasks (title, description, priority, deadline, status, user_id)
                VALUES (@title, @description, @priority, @deadline, @status, @user_id)
            `);


        res.status(201).json({ message: "Task created successfully" });
    } catch (error) {
        console.log("Error creating task:", error);
        res.status(500).json({ message: "Server error" });
    }
});


app.put("/tasks/:id",  authMiddleware,async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, priority, deadline, status } = req.body;

       
        await new sql.Request()
            .input("id", sql.Int, id)
            .input("userId", sql.Int, req.user.id)
            .input("title", sql.VarChar, title)
            .input("description", sql.VarChar, description || "")
            .input("priority", sql.VarChar, priority || "")
            .input("deadline", sql.Date, deadline || null)
            .input("status", sql.VarChar, status || "")
            .query(`
                UPDATE Tasks
                SET
                    title = @title,
                    description = @description,
                    priority = @priority,
                    deadline = @deadline,
                    status = @status
                WHERE id = @id AND user_id = @userId
            `);

        res.json({ message: "Task updated successfully" });
    } catch (error) {
        console.log("Error updating task:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.delete("/tasks/:id",  authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        await new sql.Request()
            .input("id", sql.Int, id)
            .input("userId", sql.Int, req.user.id)
            .query("DELETE FROM Tasks WHERE id = @id  AND user_id = @userId");
        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        console.log("Error deleting task:", error);
        res.status(500).json({ message: "Server error" });
    }
});


app.post("/forgot-password", async (req, res) => {
  try {
    
    const email = req.body.email?.trim().toLowerCase()

    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    const result = await new sql.Request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE email = @email")

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: "No account found with this email" })
    }

      const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
      
      await new sql.Request()
      .input("email", sql.VarChar, email)
      .input("reset_code", sql.VarChar, resetCode)
      .query(`
        UPDATE Users
        SET reset_code = @reset_code,
        reset_code_expiry = DATEADD(MINUTE, 10, GETDATE())
        WHERE LOWER(email) = @email
  `)

        await transporter.sendMail({
             from: process.env.EMAIL_USER,
             to: email,
             subject: "Password Reset Code",
             text: `Your password reset code is: ${resetCode}`
            })

      

    console.log(`Reset code for ${email}: ${resetCode}`)

    res.json({ message: "Reset code generated successfully" })
  } catch (error) {
    console.log("Forgot password error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/reset-password", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase()
    const code = req.body.code?.trim()
    const newPassword = req.body.newPassword?.trim()

  

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const userCheck = await new sql.Request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT email, reset_code, reset_code_expiry
        FROM Users
        WHERE LOWER(email) = @email
      `)

   

    const result = await new sql.Request()
      .input("email", sql.VarChar, email)
      .input("reset_code", sql.VarChar, code)
      .query(`
        SELECT *
        FROM Users
        WHERE LOWER(email) = @email
          AND reset_code = @reset_code
          AND reset_code_expiry > GETDATE()
      `)

   

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset code" })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await new sql.Request()
      .input("email", sql.VarChar, email)
      .input("user_password", sql.VarChar, hashedPassword)
      .query(`
        UPDATE Users
        SET user_password = @user_password,
            reset_code = NULL,
            reset_code_expiry = NULL
        WHERE LOWER(email) = @email
      `)

    res.json({ message: "Password reset successful" })
  } catch (error) {
    console.log("Reset password error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const checkUser = await new sql.Request()
            .input("email", sql.VarChar, email)
            .query("SELECT * FROM Users WHERE LOWER(email) = @email");

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await new sql.Request()
            .input("name", sql.VarChar, name)
            .input("email", sql.VarChar, email)
            .input("user_password", sql.VarChar, hashedPassword)
            .query(`
                INSERT INTO Users (name, email, user_password)
                VALUES (@name, @email, @user_password)
            `);

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.log("Register error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/login", async (req, res) => {
    try {

        const email = req.body.email?.trim().toLowerCase()
        const password = req.body.password

        const result = await new sql.Request()
            .input("email", sql.VarChar, email)
            .query("SELECT * FROM Users WHERE LOWER(email) = @email")

        if (result.recordset.length === 0) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const user = result.recordset[0];

        const isMatch = await bcrypt.compare(password, user.user_password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.log("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});