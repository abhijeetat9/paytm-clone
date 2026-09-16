import { Link } from "react-router-dom";

export function BottomWarning({ label, linkText, to }) {
    return <div className="py-2 text-sm flex justify-center">
        <div>{label}</div>
        <Link to={to} className="pointer underline pl-1 cursor-pointer">{linkText}</Link>
    </div>
}
