import api from "../api/axios"
import { useNavigate } from "react-router-dom";

export const AppBar = () => {
    const firstName = localStorage.getItem("firstName") || "";
    const navigate = useNavigate();

    return <div className="shadow h-14 flex justify-between">
        <div className="flex flex-col justify-center h-full ml-4">Paytm App</div>
        <div className="flex">
            <div className="flex flex-col justify-center h-full mr-4">
                Hello, {firstName}
            </div>
            <div className="rounded-full h-12 w-12 bg-slate-400 flex justify-center mt-1 mr-2">
                <div className="flex flex-col justify-center h-full text-xl">
                    {firstName[0]?.toUpperCase()}
                </div>
                
            </div>
            <button className="text-sm text-red-800 hover:text-red-600 font-medium"
                onClick={async () => {
                const refreshToken = localStorage.getItem("refreshToken");
                try {
                    await api.post("api/v1/user/logout", {
                        refreshToken,
                    });
                }finally {
                    localStorage.removeItem("token");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("firstName");
                    navigate("/signin");
                }
            }
            }>Log Out</button>
        </div>
    </div>
}
