import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ApolloProvider } from '@apollo/client/react'
import { client } from './apollo'
import { CartProvider } from './contexts/CartContext'
import Home from "./pages/Home"
import ProductDetailPage from "./pages/ProductDetailPage"
import CustomRequestsPage from "./pages/CustomRequestsPage"
import CreateProductPage from "./pages/CreateProduct/CreateProductPage"
import LoginPage from "./pages/Auth/LoginPage"
import RegisterPage from "./pages/Auth/RegisterPage"
import VerificationPage from "./pages/Auth/VerificationPage"

function App() {
  return (
    <ApolloProvider client={client}>
      <CartProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/asset/:id" element={<ProductDetailPage />} />
          <Route path="/custom-requests" element={<CustomRequestsPage />} />
          <Route path="/create-product" element={<CreateProductPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerificationPage />} />
        </Routes>
      </Router>
      </CartProvider>
    </ApolloProvider>
  )
}

export default App
