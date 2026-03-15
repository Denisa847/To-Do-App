import { useState } from "react"
import api from "../api"


function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      setMessage("Please enter your email")
      return
    }

    try {
      await api.post("/forgot-password", { email })
      setMessage("Reset code sent")
    } catch (error) {
      setMessage(error.response?.data?.message || "Something went wrong")
    }
  }

  return (
    <div className="forgot-page">
      <div className="forgot-box">
        <h2>Forgot Password</h2>
        {message && <div className="message">{message}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button type="submit">Send Reset Code</button>

          <p>
            <a href="/reset-password">Already have a code? Reset password</a>
            </p>

          <p>
            <a href="/">Back to Login</a>
          </p>
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword