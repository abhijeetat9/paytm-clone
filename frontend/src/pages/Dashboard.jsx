import { AppBar } from "../components/Appbar.jsx";
import { Balance } from "../components/Balance.jsx";
import { Users } from "../components/Users.jsx";
import { useEffect, useState } from "react";
import axios from "axios";

export const Dashboard = () => {
    const [balance, setBalance] = useState(null);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL}/api/v1/account/balance`, {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        }).then(res => setBalance(res.data.balance.toFixed(2)));
    }, []);

    return <div>
        <AppBar />
        <div className="m-8">
            <Balance value={balance ?? "..."} />
            <Users />
        </div>
    </div>
}
