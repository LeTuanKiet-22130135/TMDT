import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ApolloProvider } from '@apollo/client/react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { client } from './apollo'
import { CartProvider } from './contexts/CartContext'
import { UserProfileProvider } from './contexts/UserProfileContext'
import { SearchFilterProvider } from './contexts/SearchFilterContext'
import Home from "./pages/Home"
import ProductDetailPage from "./pages/ProductDetailPage"
import CustomRequestsPage from "./pages/CustomRequestsPage"
import CreateProductPage from "./pages/CreateProduct/CreateProductPage"
import LoginPage from "./pages/Auth/LoginPage"
import RegisterPage from "./pages/Auth/RegisterPage"
import VerificationPage from "./pages/Auth/VerificationPage"
import AuthorPage from "./pages/Author/AuthorPage"
import ProfileEditPage from "./pages/Profile/ProfileEditPage"
import CheckoutPage from "./pages/Checkout/CheckoutPage"
import CheckoutResultPage from "./pages/Checkout/CheckoutResultPage"
import LibraryPage from "./pages/Library/LibraryPage"
import FollowingFeedPage from "./pages/Following/FollowingFeedPage"
import StatusPage from "./pages/Status/StatusPage"
import EditProductPage from "./pages/EditProduct/EditProductPage"
import TrendingPage from "./pages/Trending/TrendingPage"
import CollectionPage from "./pages/Collection/CollectionPage"

function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let raf: number;

    const onMove = (e: MouseEvent) => { x = e.clientX; y = e.clientY; };
    window.addEventListener('mousemove', onMove);

    const animate = () => {
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return createPortal(
    <div
      ref={glowRef}
      className="pointer-events-none fixed top-0 left-0 w-[700px] h-[700px] rounded-full"
      style={{
        zIndex: 1,
        background: 'radial-gradient(circle, rgba(255,160,185,0.20) 0%, rgba(140,185,255,0.12) 45%, transparent 70%)',
        mixBlendMode: 'soft-light',
        willChange: 'transform',
      }}
    />,
    document.body
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <UserProfileProvider>
      <SearchFilterProvider>
      <CartProvider>
      <CursorGlow />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/asset/:id" element={<ProductDetailPage />} />
          <Route path="/asset/:id/edit" element={<EditProductPage />} />
          <Route path="/custom-requests" element={<CustomRequestsPage />} />
          <Route path="/create-product" element={<CreateProductPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerificationPage />} />
          <Route path="/author/:shortlink" element={<AuthorPage />} />
          <Route path="/profile" element={<ProfileEditPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/result" element={<CheckoutResultPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/following" element={<FollowingFeedPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/status" element={<StatusPage />} />
        </Routes>
      </Router>
      </CartProvider>
      </SearchFilterProvider>
      </UserProfileProvider>
    </ApolloProvider>
  )
}

export default App
