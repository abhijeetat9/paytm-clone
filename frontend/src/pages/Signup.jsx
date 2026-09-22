import { Heading } from "../components/ui/Heading.jsx";
import { SubHeading } from "../components/ui/SubHeading.jsx";
import { InputBox } from "../components/ui/InputBox.jsx";
import { Button } from "../components/ui/Button.jsx";
import { BottomWarning } from "../components/ui/BottomWarning.jsx";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Signup = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    return <div className="bg-slate-300 h-screen flex justify-center items-center w-full">
        <div className="rounded-lg bg-white w-100 text-center p-6 h-max px-8 shadow-lg">
            <Heading label={"Sign Up"} />
            <SubHeading label={"Enter your information to create an account"} />
            <InputBox label={"First Name"} placeholder="John" onChange={e => setFirstName(e.target.value)} />
            <InputBox label={"Last Name"} placeholder="Doe" onChange={e => setLastName(e.target.value)} />
            <InputBox label={"Email"} placeholder="user@email.com" onChange={e => setUserName(e.target.value)} />
            <InputBox label={"Password"} placeholder="Min. 6 characters" type="password" onChange={e => setPassword(e.target.value)} />
            {error && <p className="text-red-500 text-sm pt-2">{error}</p>}
            <div className="pt-4">
                <Button label={"Sign up"} onClick={async () => {
                    try {
                        setError("");
                        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/signup`, {
                            firstName, lastName, username, password
                        });
                        localStorage.setItem("token", res.data.token);
                        localStorage.setItem("firstName", firstName);
                        navigate("/dashboard");
                    } catch (e) {
                        setError(e.response?.data?.message || "Something went wrong");
                    }
                }} />
            </div>
            <BottomWarning label={"Already have an account?"} linkText={"Sign in"} to={"/signin"} />
        </div>
    </div>
}
