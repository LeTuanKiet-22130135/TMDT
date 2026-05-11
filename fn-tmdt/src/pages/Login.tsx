import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ShoppingBag } from "lucide-react"
import { Link } from "react-router-dom"

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center text-white">
      <Link to="/" className="flex items-center space-x-2 mb-8">
        <ShoppingBag className="h-10 w-10 text-purple-400" />
        <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">TMDT Shop</span>
      </Link>

      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-lg text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Đăng Nhập</CardTitle>
          <CardDescription className="text-center text-slate-400">Chào mừng bạn quay trở lại</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Email</label>
            <Input type="email" placeholder="name@example.com" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Mật khẩu</label>
            <Input type="password" placeholder="••••••••" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500" />
          </div>
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-xl">
            Đăng Nhập
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-white/10 pt-4">
          <p className="text-sm text-slate-400">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-purple-400 hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
