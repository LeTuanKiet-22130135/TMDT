import React from 'react';
import { useAdminWalletLogic } from './AdminWalletPage.logic';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, AlertCircle } from 'lucide-react';

export default function AdminWalletPage() {
  const { wallet, loading, error } = useAdminWalletLogic();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
        <AlertCircle size={20} />
        <p>Failed to load wallet data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Wallet</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="md:col-span-1">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <Wallet size={80} />
            </div>
            <div className="z-10">
              <p className="text-white/80 font-medium mb-1">Total Platform Funds</p>
              <h2 className="text-4xl font-bold tracking-tight mt-2">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(wallet?.balance || 0)}
              </h2>
            </div>
            <div className="z-10 mt-6 pt-6 border-t border-white/20">
              <p className="text-sm text-white/90">Status: <span className="font-semibold">{wallet?.status}</span></p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock size={20} className="text-indigo-600" />
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
                    <div key={txn.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-50">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAddition ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {isAddition ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 capitalize">
                            {txn.transactionType.toLowerCase().replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
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
    </div>
  );
}
