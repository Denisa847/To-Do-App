import { useState } from "react"
import api from "../api"
import "./Login.css"

function ResetPassword() {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")

  

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !code || !newPassword) {
      setMessage("Please fill in all fields")
      return
    }

    try {
      const response = await api.post("/reset-password", {
        email,
        code,
        newPassword
      })

      setMessage(response.data.message)
    } catch (error) {
      setMessage(error.response?.data?.message || "Something went wrong")
    }
  }

  return (
    <div className="forgot-page">
      <div className="forgot-box">
        <h2>Reset Password</h2>
        {message && <div className="message">{message}</div>}

        <form onSubmit={handleSubmit} autoComplete="off">
        <input
            type="email"
            name="email"
            autoComplete="off"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />    

        <input
            type="text"
            name="code"
            autoComplete="off"
            placeholder="Enter reset code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
        />

        <input
            type="password"
            name="new-password"
            autoComplete="new-password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
        />

        <button type="submit">Reset Password</button>

        <p>
            <a href="/">Back to Login</a>
        </p>
    </form>

        
      </div>
    </div>
  )
}

export default ResetPassword