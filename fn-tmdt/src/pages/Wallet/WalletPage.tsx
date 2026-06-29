import { Header } from '../../components/layout/Header';
import { useWalletLogic } from './WalletPage.logic';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, AlertCircle } from 'lucide-react';

export default function WalletPage() {
  const { wallet, loading, error, topupAmount, setTopupAmount, handleTopup, isToppingUp } = useWalletLogic();

  return (
    <div className="min-h-screen bg-[#FBFBFE] pb-24">
      <Header />
      
      <main className="max-w-4xl mx-auto pt-28 px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#040316] tracking-tight">My Wallet</h1>
          <p className="text-gray-500 mt-2">Manage your balance and view transaction history.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-[#F65C88] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} />
            <p>Failed to load wallet data. Please try again later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Balance Card */}
            <div className="md:col-span-1">
              <div className="bg-gradient-to-br from-[#FF9FB1] to-[#DB2E50] rounded-3xl p-6 text-white shadow-xl shadow-pink-500/20 relative overflow-hidden h-full flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-6 opacity-20">
                  <Wallet size={80} />
                </div>
                <div>
                  <p className="text-white/80 font-medium mb-1">Available Balance</p>
                  <h2 className="text-4xl font-bold tracking-tight">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(wallet?.balance || 0)}
                  </h2>
                </div>

                <div className="mt-8 pt-6 border-t border-white/20">
                  <p className="text-sm text-white/80 mb-2">Quick Top-up</p>
                  <div className="flex flex-col gap-3">
                    <input 
                      type="number"
                      value={topupAmount || ''}
                      onChange={(e) => setTopupAmount(Number(e.target.value))}
                      placeholder="Amount (VND)"
                      className="w-full bg-white/20 border border-white/30 placeholder-white/60 text-white rounded-xl px-4 py-2.5 outline-none focus:bg-white/30 transition-colors"
                    />
                    <button 
                      onClick={handleTopup}
                      disabled={isToppingUp || topupAmount <= 0}
                      className="w-full bg-white text-[#DB2E50] font-semibold py-2.5 rounded-xl hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2"
                    >
                      {isToppingUp ? (
                        <div className="w-5 h-5 border-2 border-[#DB2E50] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>Top-up Now</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full">
                <h3 className="text-xl font-bold text-[#040316] mb-6 flex items-center gap-2">
                  <Clock size={20} className="text-[#F65C88]" />
                  Recent Transactions
                </h3>
                
                {!wallet?.transactions || wallet.transactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Wallet size={24} />
                    </div>
                    <p>No transactions found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wallet.transactions.slice().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((txn: any) => {
                      const isAddition = txn.amount > 0;
                      return (
                        <div key={txn.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-gray-50">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isAddition ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {isAddition ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                            </div>
                            <div>
                              <p className="font-semibold text-[#040316] capitalize">
                                {txn.transactionType.toLowerCase().replace('_', ' ')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(txn.createdAt).toLocaleString()}
                                {' • '}
                                <span className={`font-medium ${
                                  txn.status === 'SUCCESS' ? 'text-green-600' : 
                                  txn.status === 'PENDING' ? 'text-orange-500' : 'text-red-500'
                                }`}>
                                  {txn.status}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className={`font-bold ${isAddition ? 'text-green-600' : 'text-red-600'}`}>
                            {isAddition ? '+' : ''}{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(txn.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
