import { useState } from "react"
import api from "../api"
import "./Register.css"

function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage]=useState("");
  
  function showMessage(text){
    setMessage(text)
    setTimeout(() =>{
        setMessage("")
      }, 2500)
    
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) {
      showMessage("Please fill in all fields")
      return
    }

    try {
      await api.post("/register", {
        name,
        email,
        password
      })

      window.location.href = "/"
    } catch (error) {
      console.log(error)
      showMessage(error.response?.data?.message || "Register failed")
    }
  }

  return (
    <div className="register-page">
      <div className="register-box">
      <h2>Register</h2>
      {message && <div className="message">{message}</div>}
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <br />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />

        <button type="submit">Register</button>
        <p>
            Already have an account? <a href="/">Login</a>
        </p>
        
      </form>
      </div>
    </div>
  )
}

export default Register