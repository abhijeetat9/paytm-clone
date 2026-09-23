import { AppBar } from "../components/Appbar.jsx";
import { Balance } from "../components/Balance.jsx";
import { Users } from "../components/Users.jsx";
import { useEffect, useState } from "react";
import api from "../api/axios";

export const Dashboard = () => {
    const [balance, setBalance] = useState(null);

    useEffect(() => {
        api.get("/api/v1/account/balance").then(res => setBalance(res.data.balance.toFixed(2)));
    }, []);

    return <div>
        <AppBar />
        <div className="m-8">
            <Balance value={balance ?? "..."} />
            <Users />
        </div>
    </div>
}
