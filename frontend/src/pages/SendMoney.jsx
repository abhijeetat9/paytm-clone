import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useState } from "react";

export const SendMoney = () => {
    const [searchParam] = useSearchParams();
    const id = searchParam.get('id');
    const name = searchParam.get('name');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    return <div className="bg-slate-300 h-screen flex justify-center items-center">
        <div className="h-full justify-center flex flex-col">
            <div className="h-min rounded-lg bg-white w-100 p-6 px-8 shadow-lg">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h2 className="text-3xl font-bold text-center">Send Money</h2>
                </div>
                <div className="p-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-2xl text-white">{name?.[0]?.toUpperCase()}</span>
                        </div>
                        <h3 className="text-2xl font-semibold">{name}</h3>
                    </div>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none" htmlFor="amount">
                                Amount (in $)
                            </label>
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                type="number"
                                placeholder="Enter Amount"
                                id="amount"
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        {success && <p className="text-green-600 text-sm">{success}</p>}
                        <button
                            className="justify-center rounded-md text-sm font-medium h-10 px-4 py-2 w-full bg-green-500 text-white"
                            onClick={async () => {
                                try {
                                    setError("");
                                    setSuccess("");
                                    await api.post("/api/v1/account/transfer", {
                                        to: id,
                                        amount: Number(amount)
                                    });
                                    setSuccess("Transfer successful!");
                                } catch (e) {
                                    setError(e.response?.data?.message || "Transfer failed");
                                }
                            }}
                        >
                            Initiate Transfer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
}
