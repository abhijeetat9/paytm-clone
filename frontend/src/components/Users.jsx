import { useEffect, useState } from "react";
import { Button } from "./ui/Button.jsx";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export const Users = () => {
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        api.get(`/api/v1/user/bulk?filter=${filter}`).then(res => setUsers(res.data.users)).
            catch(err => console.log(err));
    }, [filter]);

    return <>
        <div className="font-bold mt-6 text-lg">Users</div>
        <div className="my-4">
            <input
                type="text"
                className="block w-full p-3 border rounded-full border-slate-700 text-sm shadow-xs placeholder:text-body"
                placeholder="Search"
                onChange={e => setFilter(e.target.value)}
            />
        </div>
        <div>
            {users.map(user => <User key={user._id} user={user} />)}
        </div>
    </>
}

function User({ user }) {
    const navigate = useNavigate();
    return <div className="flex justify-between mt-2">
        <div className="flex">
            <div className="rounded-full h-10 w-10 bg-slate-400 flex justify-center mt-1 mr-2">
                <div className="flex flex-col justify-center h-full text-xl">
                    {user.firstName?.[0]?.toUpperCase()}
                </div>
            </div>
            <div className="flex flex-col justify-center h-full">
                <div>{user.firstName} {user.lastName}</div>
            </div>
        </div>
        <div className="flex justify-center h-full">
            <Button label={"Send Money"} onClick={() => navigate(`/send?id=${user._id}&name=${user.firstName} ${user.lastName}`)} />
        </div>
    </div>
}
