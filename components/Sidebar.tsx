import { NavigationContext } from "@/lib/NavigationProvider";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation"
import { use } from "react";
import { Button } from "./ui/button";
import { useMutation, useQuery} from "convex/react";
import { api } from "@/convex/_generated/api";

import { Id } from "@/convex/_generated/dataModel";
import ChatRow from "./ChatRow";

function Sidebar() {
    const router = useRouter();
    const { closeMobileNav, isMobileNavOpen } = use(NavigationContext);

    const chats = useQuery(api.chats.listChats);
    const createChat = useMutation(api.chats.createChat );
    const deleteChat = useMutation(api.chats.deleteChat);



    const handelNewChat = async () => {
        try {
            const chatId = await createChat({ title: "New chat" });
            router.push(`/dashboard/chat/${chatId}`);
            closeMobileNav();
        } catch (error) {
            console.error("Error creating new chat:", error);
        }
    }

    const handelDeleteChat = async (id: Id<"chats">) => {
        try {
            const chat = chats?.find(chat => chat._id === id);
            if (!chat) {
                console.error("Chat not found in local state");
                return;
            }

            await deleteChat({ id });
            
            if(window.location.pathname.includes(id)){
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Error deleting chat:", error);
        }
    };

    return (
        <>
            {/* background Overlay for mobile*/}
            {isMobileNavOpen && (
                <div
                className="fixed inset-0  bg-black/50 z-40 md:hidden" 
                onClick={closeMobileNav}    
                />
            )}    

            <div 
                className={cn(
                    "fixed md:inset-y-0 top-14 bottom-0 left-0 z-50 w-72 bg-gray-50/80 backdrop-blur-xl border-r border-gray-200/50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:top-0 flex flex-col",
                    isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="p-4 border-b border-gray-200/50 ">
                    <Button
                        onClick = {handelNewChat}
                        className= "w-full bg-white  hover:bg-gray-50 text-gray-700 border border-gray-200/50 shadow-sm hover:shadow transition-all duration-200"
                    >
                        <PlusIcon className="mr-2 h-4 w-4  "/>New Chat

                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 p-4 scrollbar-thin
                    scrollbar-thumb-gray-200 scrollbar-track-transparent">

                    {chats?.map((chat) => (
                        <ChatRow key = {chat._id} chat={chat} onDelete={handelDeleteChat}/>
                    ))}


                </div>
            </div> 


        </>
    )
}

export default Sidebar