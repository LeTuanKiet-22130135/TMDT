import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, ShoppingBag, Zap, Shield } from "lucide-react"
import { Link } from "react-router-dom"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 backdrop-blur-md bg-opacity-30 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="h-8 w-8 text-purple-400" />
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">TMDT Shop</span>
        </div>
        <div className="space-x-4">
          <Link to="/products" className="hover:text-purple-400 transition-colors">Sản phẩm</Link>
          <Link to="/login">
            <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10">
              Đăng nhập
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl font-extrabold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
          Trải Nghiệm Mua Sắm Thế Hệ Mới
        </h1>
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
          Khám phá những sản phẩm tuyệt vời với công nghệ hiện đại và giao hàng siêu tốc.
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/products">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-purple-500/30 transition-all hover:scale-105">
              Mua Ngay <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl">
            Tìm hiểu thêm
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32">
          <Card className="bg-white/5 border-white/10 backdrop-blur-lg text-white hover:border-purple-500/50 transition-colors">
            <CardHeader>
              <Zap className="h-10 w-10 text-yellow-400 mb-2" />
              <CardTitle>Siêu Tốc</CardTitle>
              <CardDescription className="text-slate-400">Giao hàng trong vòng 2h tại khu vực nội thành.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-lg text-white hover:border-purple-500/50 transition-colors">
            <CardHeader>
              <Shield className="h-10 w-10 text-green-400 mb-2" />
              <CardTitle>Bảo Mật</CardTitle>
              <CardDescription className="text-slate-400">Thanh toán an toàn với hệ thống bảo mật cao cấp.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-lg text-white hover:border-purple-500/50 transition-colors">
            <CardHeader>
              <ShoppingBag className="h-10 w-10 text-pink-400 mb-2" />
              <CardTitle>Đa Dạng</CardTitle>
              <CardDescription className="text-slate-400">Hàng ngàn sản phẩm chính hãng từ các thương hiệu lớn.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  )
}
