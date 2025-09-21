"use client";

import { useState, useRef, useEffect, FormEvent, useMemo } from "react";
import { useRoom, RoomMessage } from "@/PeerJsConnectivity/peerManager";

const ChatPage = () => {
  const {
    createRoom,
    joinRoom,
    sendObject,
    leaveRoom,
    participants,
    messages,
    localPeerId,
    isHost,
    roomId,
    loading,
    error,
  } = useRoom();

  const [inputRoomId, setInputRoomId] = useState("");
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Helper function to safely convert error to string
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
      try {
        return JSON.stringify(error);
      } catch {
        return 'An unknown error occurred';
      }
    }
    return String(error);
  };

  // Auto-scroll to the bottom of the messages list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Memoize error message to avoid TypeScript issues
  const errorMessage = useMemo(() => {
    if (!error) return null;
    return getErrorMessage(error);
  }, [error]);

  const handleCreateRoom = async () => {
    if (loading) return;
    try {
      await createRoom();
    } catch (e) {
      console.error("Failed to create room:", e);
    }
  };

  const handleJoinRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || !inputRoomId) return;
    try {
      await joinRoom(inputRoomId);
    } catch (e) {
      console.error("Failed to join room:", e);
    }
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !roomId) return;
    sendObject({ text: message });
    setMessage("");
  };

  const renderMessage = (msg: RoomMessage) => {
    const isLocal = msg.from === localPeerId;
    return (
      <div
        key={msg.timestamp}
        className={`flex ${isLocal ? "justify-end" : "justify-start"} mb-2`}
      >
        <div
          className={`p-2 rounded-lg max-w-[70%] ${
            isLocal ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
          }`}
        >
          <span className="text-xs text-gray-400">
            {isLocal ? "You" : `Peer: ${msg.from.substring(0, 5)}...`}
          </span>
          <p>{(msg.payload as { text: string })?.text}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 p-4">
      {/* Connection UI */}
      {!roomId && (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-3xl font-bold mb-4">Chat Room</h1>
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg mb-4 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Room"}
          </button>
          <form onSubmit={handleJoinRoom} className="flex gap-2">
            <input
              type="text"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              placeholder="Enter Room ID to Join"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !inputRoomId}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Join Room
            </button>
          </form>
          {errorMessage && (
            <p className="text-red-500 mt-2">
              Error: {errorMessage}
            </p>
          )}
        </div>
      )}

      {/* Chat UI */}
      {roomId && (
        <div className="flex flex-col h-full w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Room: {roomId}</h2>
              <p className="text-sm">
                Status: {isHost ? "Host" : "Participant"} (ID:{" "}
                {localPeerId?.substring(0, 5)}...)
              </p>
              <p className="text-xs">
                Participants: {participants.length}
                {participants.map((p) => ` ${p.substring(0, 5)}...`)}
              </p>
            </div>
            <button
              onClick={leaveRoom}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg"
            >
              Leave
            </button>
          </div>

          {/* Messages display */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((msg) => renderMessage(msg))}
            <div ref={messagesEndRef} />
          </div>
          [Image of a chat interface with a message list and an input field]

          {/* Message input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatPage;