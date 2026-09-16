import { Heading } from "../components/Heading.jsx";
import { SubHeading } from "../components/SubHeading.jsx";
import { InputBox } from "../components/InputBox.jsx";
import { Button } from "../components/Button.jsx";
import { BottomWarning } from "../components/BottomWarning.jsx";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Signin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    return <div className="bg-slate-300 h-screen flex justify-center items-center">
        <div className="rounded-lg bg-white w-100 text-center p-6 h-max px-8 shadow-lg">
            <Heading label={"Sign In"} />
            <SubHeading label={"Enter your credentials to access your account"} />
            <InputBox label={"Email"} placeholder={"user@email.com"} onChange={(e) => setUsername(e.target.value)} />
            <InputBox label={"Password"} placeholder={""} type="password" onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-red-500 text-sm pt-2">{error}</p>}
            <div className="pt-4">
                <Button label={"Sign in"} onClick={async () => {
                    try {
                        setError("");
                        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/signin`, {
                            username, password
                        });
                        localStorage.setItem("token", res.data.token);
                        localStorage.setItem("firstName", res.data.firstName);
                        navigate("/dashboard");
                    } catch (e) {
                        setError(e.response?.data?.message || "Invalid credentials");
                    }
                }} />
            </div>
            <BottomWarning label={"Don't have an account?"} linkText={"Sign Up"} to={"/signup"} />
        </div>
    </div>
}
