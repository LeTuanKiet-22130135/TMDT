import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ApolloProvider } from '@apollo/client/react'
import { client } from './apollo'
import { CartProvider } from './contexts/CartContext'
import { UserProfileProvider } from './contexts/UserProfileContext'
import Home from "./pages/Home"
import ProductDetailPage from "./pages/ProductDetailPage"
import CustomRequestsPage from "./pages/CustomRequestsPage"
import CreateProductPage from "./pages/CreateProduct/CreateProductPage"
import LoginPage from "./pages/Auth/LoginPage"
import RegisterPage from "./pages/Auth/RegisterPage"
import VerificationPage from "./pages/Auth/VerificationPage"
import AuthorPage from "./pages/Author/AuthorPage"
import ProfileEditPage from "./pages/Profile/ProfileEditPage"

function App() {
  return (
    <ApolloProvider client={client}>
      <UserProfileProvider>
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
          <Route path="/author/:shortlink" element={<AuthorPage />} />
          <Route path="/profile" element={<ProfileEditPage />} />
        </Routes>
      </Router>
      </CartProvider>
      </UserProfileProvider>
    </ApolloProvider>
  )
}

export default App
