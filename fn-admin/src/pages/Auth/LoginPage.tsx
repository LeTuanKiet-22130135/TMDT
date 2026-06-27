import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { ShieldCheck, Mail, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button, Input } from "@/components/ui";
import { LOGIN_MUTATION } from "@/services/graphql/admin.graphql";

interface LoginResponse {
  login: {
    accessToken: string;
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
    };
  };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [loginMutation, { loading }] = useMutation<LoginResponse>(LOGIN_MUTATION);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      setError("");
      const { data } = await loginMutation({ variables: { email, password } });
      if (data?.login) {
        const { accessToken, user } = data.login;
        if (user.role !== "ADMIN") {
          setError("Tài khoản không có quyền truy cập admin");
          return;
        }
        login(accessToken, user);
        navigate("/");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("Email hoặc mật khẩu không đúng");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-2xl"
            style={{ background: "var(--accent)" }}
          >
            <ShieldCheck size={24} color="white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Lumine Admin
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Đăng nhập để quản lý hệ thống
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl border p-6 space-y-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <Input
            label="Email"
            type="email"
            placeholder="admin@lumine.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            leftIcon={<Mail size={14} />}
          />
          <Input
            label="Mật khẩu"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            leftIcon={<Lock size={14} />}
          />

          {error && (
            <p className="text-xs text-center" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}

          <Button className="w-full justify-center" onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </div>
      </div>
    </div>
  );
}
