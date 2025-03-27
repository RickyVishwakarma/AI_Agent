import { Doc, Id } from "@/convex/_generated/dataModel";
import { NavigationContext } from "@/lib/NavigationProvider";
import { useContext } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "lucide-react";
import { Button } from "./ui/button";

function ChatRow({
    chat,
    onDelete,
}: {
    chat: Doc<"chats">;
    onDelete: (id: Id<"chats">) => void;
}) {
    const router = useRouter();
    const { closeMobileNav } = useContext(NavigationContext);

    const handleClick = () => {
        router.push(`/dashboard/chat/${chat._id}`);
        closeMobileNav();
    };

    return (
        <div
            className="group rounded-xl border border-gray-200/30 bg-white/50 backdrop-blur-sm
                hover:bg-white/80 transition-all duration-200 cursor-pointer shadow-sm 
                hover:shadow-md relative"
            onClick={handleClick}
        >
            <div className="p-4">
                <div className="flex justify-between items-center">
                    <span className="truncate flex-1">{chat.title}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 -mr-2 -mt-2 ml-2 transition-opacity duration-200"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(chat._id);
                        }}
                    >
                        <TrashIcon className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors"/>
                    </Button>
                </div>
            </div>
            
        </div>
    );
}

export default ChatRow;
