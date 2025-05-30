import { handler } from "tailwindcss-animate";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


// CREATION OF THE CHAT TABLE
export const createChat = mutation({
    args: {
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if(!identity){
            throw new Error("Not authenticated");
        }

        const chat = await ctx.db.insert("chats", {
            title: args.title,
            userId: identity.subject,
            createdAt: Date.now(),
        });

        return chat;
    },
});



//DELETION OF THE CHAT TABLE
export const deleteChat = mutation({
  args: { id: v.id("chats") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(args.id);
    if (!chat) {
      throw new Error("Chat not found");
    }

    // Check if the user owns this chat
    if (chat.userId !== identity.subject) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
    return true;
  },
});



export const listChats = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
 
        if(!identity) {
            throw new Error("Not authenticated");
        }

        const chats = await ctx.db
            .query("chats")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .order("desc")
            .collect();

        return chats;    
    },
});

export const updateTitle = mutation({
  args: { id: v.id("chats"), title: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(args.id);
    if (!chat) {
      throw new Error("Chat not found");
    }

    // Check if the user owns this chat
    if (chat.userId !== identity.subject) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, { title: args.title });
    return true;
  },
});