import { useState } from "react"
import api from "../api"
import "./Login.css"


function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage]=useState("");


  function showMessage(text){
    setMessage(text)
    setTimeout(() =>{
        setMessage("")
      }, 2500)
    
  }


  const handleLogin = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      showMessage("Please enter email and password")
      return
  }

    try {
      const response = await api.post("/login", {
        email,
        password
      })

      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.user))

      

      window.location.href = "/dashboard"
    } catch (error) {
      console.log(error)
      showMessage("Login failed")
    }
  }

  return (
    <div className="login-page">
     <div className="login-box">
      <h2>Login</h2>
      {message && <div className="message">{message}</div>}

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <p className="forgot-link">
          <a href="/forgot-password">Forgot password?</a>
        </p>

        <button type="submit">Login</button>
        <p className="register-link">
             Don’t have an account? <a href="/register">Register</a>
        </p>
        
      </form>
    </div>
    </div>
  )
}

export default Login