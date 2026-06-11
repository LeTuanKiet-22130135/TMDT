import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import ProductDetailPage from "./pages/ProductDetailPage"
import CustomRequestsPage from "./pages/CustomRequestsPage"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/asset/:id" element={<ProductDetailPage />} />
        <Route path="/custom-requests" element={<CustomRequestsPage />} />
      </Routes>
    </Router>
  )
}

export default App

