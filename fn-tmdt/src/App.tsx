import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from "@/pages/Home"
import Login from "@/pages/Login"
import ProductList from "@/pages/ProductList"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/products" element={<ProductList />} />
      </Routes>
    </Router>
  )
}

export default App
