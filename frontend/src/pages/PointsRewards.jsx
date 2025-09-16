import React, { useEffect, useState } from 'react'
import api from '../api'
import LoadingSpinner, { LoadingButton } from '../components/LoadingSpinner'
import ErrorMessage, { SuccessMessage } from '../components/ErrorMessage'

export default function PointsRewards(){
  const [tx, setTx] = useState([])
  const [balance, setBalance] = useState(0)
  const [redeemAmount, setRedeemAmount] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { 
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [txRes, balanceRes] = await Promise.all([
        api.get('/points/transactions'),
        api.get('/points/balance')
      ])
      setTx(txRes.data)
      setBalance(balanceRes.data.balance || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async () => {
    const amount = parseInt(redeemAmount)
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (amount > balance) {
      setError('Insufficient points')
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await api.post('/redeem-qr', { amount })
      setQrCode(response.data.qr_code)
      setSuccess(`QR code generated for ${amount} points!`)
      setRedeemAmount('')
      loadData() // Reload balance
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-semibold mb-6">Points & Rewards</h1>
        
        {error && <ErrorMessage error={error} onDismiss={() => setError('')} className="mb-4" />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} className="mb-4" />}

        {/* Balance and Redeem Section */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Points Balance</h2>
            <span className="text-2xl font-bold text-blue-600">{balance}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <input
              type="number"
              placeholder="Enter amount to redeem"
              value={redeemAmount}
              onChange={e => setRedeemAmount(e.target.value)}
              className="flex-1 border p-2 rounded"
              min="1"
              max={balance}
              disabled={loading}
            />
            <LoadingButton
              loading={loading}
              onClick={handleRedeem}
              className="bg-custom-gradient text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
              disabled={!redeemAmount || parseInt(redeemAmount) <= 0}
            >
              Generate QR Code
            </LoadingButton>
          </div>
        </div>

        {/* QR Code Display */}
        {qrCode && (
          <div className="bg-green-50 p-4 rounded-lg mb-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Your QR Code</h3>
            <p className="text-sm text-gray-600 mb-4">Show this QR code at the cafeteria to redeem your points</p>
            <div className="flex justify-center">
              <img src={qrCode} alt="QR Code" className="border rounded" />
            </div>
            <button
              onClick={() => setQrCode('')}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Close QR Code
            </button>
          </div>
        )}

        {/* Transaction History */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
          {loading ? (
            <LoadingSpinner className="py-8" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Date</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {tx.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-4 text-center text-gray-500">
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    tx.map(t => (
                      <tr key={t.id} className="border-b hover:bg-gray-50">
                        <td className="py-2">{new Date(t.created_at).toLocaleString()}</td>
                        <td className={`py-2 font-medium ${t.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {t.amount >= 0 ? '+' : ''}{t.amount}
                        </td>
                        <td className="py-2">{t.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rewards Info */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">How to Use Points</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Generate a QR code for the amount you want to redeem</li>
            <li>• Show the QR code at the company cafeteria</li>
            <li>• Points will be deducted from your balance</li>
            <li>• Earn points by asking questions, answering, and participating in discussions</li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  )
}
