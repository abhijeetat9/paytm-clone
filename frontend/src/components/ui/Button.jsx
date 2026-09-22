export function Button({ label, onClick }) {
    return <button
        onClick={onClick}
        type="button"
        className="text-white bg-gray-900 font-medium rounded-full text-sm px-4 py-2.5 w-full focus:outline-none"
    >
        {label}
    </button>
}
