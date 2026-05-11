import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ShoppingBag, Search, Filter } from "lucide-react"
import { Link } from "react-router-dom"
import headphoneImg from "@/assets/headphone_featured.png"

const products = [
  { id: 1, name: "Tai nghe Không Dây Pro", price: "2.500.000đ", image: headphoneImg },
  { id: 2, name: "Đồng Hồ Thông Minh S3", price: "4.200.000đ", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80" },
  { id: 3, name: "Bàn Phím Cơ RGB", price: "1.800.000đ", image: "https://images.unsplash.com/photo-1587829741301-dc798b83bac1?w=500&q=80" },
  { id: 4, name: "Chuột Gaming Không Dây", price: "1.200.000đ", image: "https://images.unsplash.com/photo-1527443704276-ae513b6462e4?w=500&q=80" },
]

export default function ProductList() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 backdrop-blur-md bg-opacity-30 border-b border-white/10">
        <Link to="/" className="flex items-center space-x-2">
          <ShoppingBag className="h-8 w-8 text-purple-400" />
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">TMDT Shop</span>
        </Link>
        <div className="relative w-full max-w-md mx-4">
          <Input placeholder="Tìm kiếm sản phẩm..." className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 pl-10 pr-4 py-2 w-full focus:border-purple-500" />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/cart">
            <Button variant="ghost" className="text-white hover:text-purple-400">
              Giỏ hàng
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10">
              Đăng nhập
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Danh Sách Sản Phẩm</h1>
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10">
            <Filter className="mr-2 h-4 w-4" /> Bộ lọc
          </Button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="bg-white/5 border-white/10 backdrop-blur-lg text-white hover:border-purple-500/50 transition-all hover:scale-105 overflow-hidden">
              <div className="h-48 bg-slate-800 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription className="text-purple-400 font-bold">{product.price}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Thêm vào giỏ
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
