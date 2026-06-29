import React from 'react';
import { useWithdrawalLogic, VIETNAM_BANKS, MIN_WITHDRAWAL } from './WithdrawalPage.logic';
import { Header } from '../../components/layout/Header';
import { formatPrice } from '../../components/Cart/cart.logic';
import { Wallet, ArrowRight, Loader2, Clock, CheckCircle2, XCircle, AlertTriangle, ChevronDown } from 'lucide-react';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(date);
};

const parseBankDetails = (raw: string) => {
  try {
    const obj = JSON.parse(raw);
    return `${obj.bank} • ${obj.accountNumber} • ${obj.holderName}`;
  } catch {
    return raw;
  }
};

export const WithdrawalPage: React.FC = () => {
  const {
    withdrawals, loading, withdrawing,
    amount, setAmount,
    bankName, setBankName,
    accountNumber, setAccountNumber,
    holderName, setHolderName,
    error, success, conditionErrors,
    canSubmit, currentBalance,
    handleWithdraw,
  } = useWithdrawalLogic();

  if (loading) {
    return (
      <div className="bg-transparent font-body text-on-surface antialiased h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#F65C88] mb-4" size={32} />
        <p className="text-sm font-medium text-[#040316]/60">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="bg-transparent font-body text-on-surface antialiased min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 flex flex-col gap-8">

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF9FB1] to-[#DB2E50] flex items-center justify-center text-white shadow-lg">
            <Wallet size={24} />
          </div>
          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight">Rút tiền</h1>
            <p className="text-sm text-[#040316]/60 mt-1">Yêu cầu rút tiền từ ví nội bộ về tài khoản ngân hàng</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — Form */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Condition warnings */}
            {conditionErrors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-2">
                {conditionErrors.map((msg, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-amber-700 font-medium">
                    <AlertTriangle size={16} className="shrink-0" />
                    {msg}
                  </div>
                ))}
              </div>
            )}

            {/* Success banner */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-2 text-sm text-green-700 font-medium">
                <CheckCircle2 size={16} className="shrink-0" />
                Gửi yêu cầu rút tiền thành công! Admin sẽ xử lý trong 1-3 ngày làm việc.
              </div>
            )}

            <div className="bg-white/70 backdrop-blur-sm border border-[#FFC9D2]/30 rounded-3xl p-8 shadow-sm">
              <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                <ArrowRight size={20} className="text-[#F65C88]" />
                Tạo yêu cầu mới
              </h2>

              <form onSubmit={handleWithdraw} className="flex flex-col gap-5">

                {/* Amount */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#040316]/80">Số tiền cần rút</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="0"
                      min={MIN_WITHDRAWAL}
                      className="w-full bg-white/80 border border-[#FFC9D2]/50 rounded-2xl px-5 py-4 font-bold text-xl focus:outline-none focus:border-[#F65C88] transition-colors"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-[#040316]/40">₫</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[50000, 100000, 500000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[#FFC9D2]/50 hover:bg-[#FFF1F3] hover:border-[#F65C88] hover:text-[#F65C88] transition-colors"
                      >
                        {formatPrice(val)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAmount(currentBalance)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[#FFC9D2]/50 hover:bg-[#FFF1F3] hover:border-[#F65C88] hover:text-[#F65C88] transition-colors"
                    >
                      Tất cả
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#FFC9D2]/30 pt-1">
                  <p className="text-sm font-semibold text-[#040316]/70 mb-4">Thông tin tài khoản nhận</p>

                  {/* Bank name select */}
                  <div className="flex flex-col gap-2 mb-4">
                    <label className="text-xs font-semibold text-[#040316]/60 uppercase tracking-wide">Ngân hàng</label>
                    <div className="relative">
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full appearance-none bg-white/80 border border-[#FFC9D2]/50 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-[#F65C88] transition-colors cursor-pointer"
                      >
                        <option value="">-- Chọn ngân hàng --</option>
                        {VIETNAM_BANKS.map((b) => (
                          <option key={b.code} value={b.name}>{b.name} ({b.code})</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#040316]/40 pointer-events-none" />
                    </div>
                  </div>

                  {/* Account number */}
                  <div className="flex flex-col gap-2 mb-4">
                    <label className="text-xs font-semibold text-[#040316]/60 uppercase tracking-wide">Số tài khoản</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="VD: 0123456789"
                      inputMode="numeric"
                      className="w-full bg-white/80 border border-[#FFC9D2]/50 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-[#F65C88] transition-colors tracking-widest"
                    />
                  </div>

                  {/* Holder name */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-[#040316]/60 uppercase tracking-wide">Tên chủ tài khoản</label>
                    <input
                      type="text"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      placeholder="VD: NGUYEN VAN A"
                      className="w-full bg-white/80 border border-[#FFC9D2]/50 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-[#F65C88] transition-colors uppercase"
                    />
                    <p className="text-xs text-[#040316]/40">Nhập đúng tên in hoa như trên thẻ/CMND để tránh sai sót.</p>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full mt-2 py-4 bg-gradient-to-r from-[#FF9FB1] via-[#F65C88] to-[#DB2E50] text-white rounded-full font-bold shadow-md hover:shadow-lg hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {withdrawing ? <Loader2 size={18} className="animate-spin" /> : 'Xác nhận rút tiền'}
                </button>

              </form>
            </div>
          </div>

          {/* Right — Balance & History */}
          <div className="lg:col-span-1 flex flex-col gap-6">

            <div className="bg-gradient-to-br from-[#FFF1F3] to-[#F0F5FF] border border-[#FFC9D2]/60 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm">
              <span className="text-sm font-bold text-[#040316]/60 mb-2">Số dư khả dụng</span>
              <span className="text-3xl font-extrabold text-[#F65C88]">{formatPrice(currentBalance)}</span>
              {currentBalance < MIN_WITHDRAWAL && (
                <p className="text-xs text-amber-600 font-medium mt-2">
                  Chưa đủ điều kiện rút tiền (tối thiểu {formatPrice(MIN_WITHDRAWAL)})
                </p>
              )}
            </div>

            <div className="bg-white/70 backdrop-blur-sm border border-[#FFC9D2]/30 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col h-full">
              <h2 className="font-bold text-base mb-4">Lịch sử rút tiền</h2>

              {withdrawals.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-[#040316]/30">
                  <Clock size={32} className="mb-2 opacity-50" />
                  <p className="text-sm font-medium">Chưa có giao dịch nào</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {withdrawals.map((txn: any) => (
                    <div key={txn.id} className="flex flex-col gap-2 p-4 border border-[#FFC9D2]/20 bg-white/50 rounded-2xl">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-[#F65C88]">{formatPrice(txn.amount)}</span>
                        {txn.status === 'PENDING' && (
                          <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">
                            <Clock size={12} /> Chờ xử lý
                          </span>
                        )}
                        {txn.status === 'SUCCESS' && (
                          <span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">
                            <CheckCircle2 size={12} /> Thành công
                          </span>
                        )}
                        {txn.status === 'FAILED' && (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                            <XCircle size={12} /> Thất bại
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#040316]/60">{formatDate(txn.createdAt)}</div>
                      {txn.referenceId && (
                        <div className="text-xs text-[#040316]/50 mt-1 break-all">
                          {parseBankDetails(txn.referenceId)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default WithdrawalPage;
