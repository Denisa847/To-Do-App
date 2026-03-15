import { useEffect, useState } from "react"
import api from "../api"
import "./Dashboard.css"

function Dashboard() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("")
  const [deadline, setDeadline] = useState("")
  const [status, setStatus] = useState("")
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [message, setMessage]=useState("");


  function showMessage(text){
    setMessage(text)
    setTimeout(() =>{
        setMessage("")
      }, 2500)
    
  }

 

  const user=JSON.parse(localStorage.getItem("user") || "null")

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/"
  }

  
  const fetchTasks = async () => {
    try {
      console.log("Fetching tasks for user.id:", user?.id)
      const response = await api.get(`/tasks`, {
         headers: { Authorization: `Bearer ${localStorage.getItem("token")}`}
          })
      console.log("Fetched tasks response:", response.data)
      setTasks(response.data)
    } catch (error) {
      console.log("Error fetching tasks:", error)
    }
  }
  

  useEffect(() => {
  fetchTasks();}, []);

  const resetForm= () =>{
    setTitle("")
    setDescription("")
    setPriority("")
    setDeadline("")
    setStatus("")
    setEditingTaskId(null)
  }

  const handleEdit = (task) => {
    setEditingTaskId(task.id)
    setTitle(task.title)
    setDescription(task.description || "")
    setPriority(task.priority || "")
    setDeadline(task.deadline ? task.deadline.split("T")[0] : "")
    setStatus(task.status || "")
  }

  const handleAddTask = async (e) => {
    e.preventDefault()

    
    console.log("Logged user:", user)

    if (!title.trim()){
      showMessage("Title is required")
      return
    }

    if (!user || !user.id) {
      showMessage("User not found. Please login again.")
      return
    }


    try {
      if (editingTaskId) {
        await api.put(`/tasks/${editingTaskId}`, {
          title,
          description,
          priority,
          deadline,
          status},  { headers: { Authorization: `Bearer ${localStorage.getItem("token")}`}
        })
      } else {
        await api.post("/tasks", {
          title,
          description,
          priority,
          deadline,
          status
        }, {headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
         }
        }
      )
      }

      const wasEditing = editingTaskId
      resetForm()
      await fetchTasks()
      showMessage(wasEditing ? "Task updated successfully!" : "Task created successfully!")
      
    } catch (error) {
      //console.log("Error saving task:", error)
     
     
      console.log("Full error:", error)
      console.log("Response data:", error.response?.data)
      console.log("Response status:", error.response?.status)
      showMessage(error.response?.data?.message || "Failed to save task")
    }
}



  const handleDelete = async (id) => {
    try {
      await api.delete(`/tasks/${id}` , {headers: {
     Authorization: `Bearer ${localStorage.getItem("token")}`}
  })
      fetchTasks()
      showMessage("Task deleted successfully!")
    } catch (error) {
      console.log("Error deleting task:", error)
      showMessage("Failed to delete task");
    }
  }

  return (
    <div className="dashboard-container">
      <h1>Hello, {user?.name}!</h1>
      <button className="logout-btn" onClick={handleLogout}>
        Logout
        </button>

      <h2>{editingTaskId ? "Edit Task" : "Add Task"}</h2>

      {message && <p className="message">{message}</p>}

      <form onSubmit={handleAddTask}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <br />

        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <br />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">Select priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        <br />

        <input
          type="date"
          value={deadline}
          min={new Date().toISOString().split("T")[0]}
          max="2035-12-31"
          onChange={(e) => setDeadline(e.target.value)}
        />

        <br />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Select status</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        <br />

        <button type="submit">
          {editingTaskId ? "Update Task" : "Add Task"}
        </button>
         {editingTaskId && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      
      </form>
      <h2>My Tasks</h2>

      

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Priority</th>
            <th>Deadline</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan="6" className="empty-message">
                You don't have any tasks yet. Add your first task!
              </td>
            </tr>) :
             (tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.title}</td>
              <td>{task.description}</td>
              <td>{task.priority}</td>
              <td className="deadline">{task.deadline ? task.deadline.split("T")[0] : ""}</td>
              <td className={`status ${task.status.replaceAll(" ", "-")}`}>
                  {task.status}
                </td>

              <td>
                <button className="edit-btn" onClick={() => handleEdit(task)}>Edit</button>
                <button className="delete-btn" onClick={() => handleDelete(task.id)}>Delete</button>
              </td>
            </tr>
          )))
          }
        </tbody>
      </table>
    </div>
  )
}

export default Dashboard