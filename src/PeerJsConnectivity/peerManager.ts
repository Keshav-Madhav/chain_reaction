"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Peer, { DataConnection, PeerJSOption } from "peerjs";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { UserData } from "@/stores/userStore";

/*********************** Types **************************/

/** A unique identifier for a peer, which is a string. */
type PeerId = string;

/**
 * Represents a message sent within a room.
 */
export type RoomMessage = {
  from: PeerId;
  type?: string; // custom type field
  payload?: unknown; // Use unknown for a safer generic payload
  timestamp: number;
};

/**
 * Control messages used for internal communication between peers.
 */
type ControlMessage =
  | { __control: "join"; peerId: PeerId; userData?: UserData }
  | { __control: "reject"; reason: string }
  | { __control: "peer-list"; peers: PeerId[]; usersData?: UserData[] }
  | { __control: "new-peer"; peerId: PeerId; userData?: UserData }
  | { __control: "user-update"; userData: UserData }
  | { __control: "peer-left"; peerId: PeerId };

/**
 * A message that can be sent or received over a PeerJS DataConnection.
 */
type PeerMessage = RoomMessage | ControlMessage;

/*********************** Zustand Store ******************/

type RoomState = {
  localPeerId: PeerId | null;
  isHost: boolean;
  roomId: string | null;
  participants: PeerId[]; // includes localPeerId
  messages: RoomMessage[];
  addParticipant: (id: PeerId) => void;
  removeParticipant: (id: PeerId) => void;
  addMessage: (m: RoomMessage) => void;
  setLocalPeerId: (id: PeerId | null) => void;
  setIsHost: (h: boolean) => void;
  setRoomId: (r: string | null) => void;
};

export const useRoomStore = create<RoomState>((set) => ({
  localPeerId: null,
  isHost: false,
  roomId: null,
  participants: [],
  messages: [],
  addParticipant: (id) =>
    set((s) => ({ participants: Array.from(new Set([...s.participants, id])) })),
  removeParticipant: (id) => set((s) => ({ participants: s.participants.filter((p) => p !== id) })),
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  setLocalPeerId: (id) => set(() => ({ localPeerId: id })),
  setIsHost: (h) => set(() => ({ isHost: h })),
  setRoomId: (r) => set(() => ({ roomId: r })),
}));

/*********************** Utilities ************************/

export const createRoomId = (): string => {
  // Use a full UUID for a robust, unique room ID.
  return uuidv4();
};

/*********************** PeerManager ************************/

export class PeerManager {
  peer: Peer | null = null;
  connections: Map<PeerId, DataConnection> = new Map();
  usersData: Map<PeerId, UserData> = new Map(); // Store user data for all peers
  isHost = false;
  roomId: string | null = null;
  maxParticipants: number;
  onPeerListUpdate: (peers: PeerId[]) => void;
  onMessage: (msg: RoomMessage) => void;
  onError: (err: unknown) => void;
  onUserDataUpdate?: (userData: UserData) => void;
  onUserListUpdate?: (usersData: UserData[]) => void;
  onPeerLeft?: (peerId: PeerId) => void;

  constructor(options: {
    onPeerListUpdate: (peers: PeerId[]) => void;
    onMessage: (msg: RoomMessage) => void;
    onError?: (err: unknown) => void;
    maxParticipants?: number;
    onUserDataUpdate?: (userData: UserData) => void;
    onUserListUpdate?: (usersData: UserData[]) => void;
    onPeerLeft?: (peerId: PeerId) => void;
  }) {
    this.onPeerListUpdate = options.onPeerListUpdate;
    this.onMessage = options.onMessage;
    this.onError = options.onError || console.error;
    this.maxParticipants = options.maxParticipants ?? 4;
    this.onUserDataUpdate = options.onUserDataUpdate;
    this.onUserListUpdate = options.onUserListUpdate;
    this.onPeerLeft = options.onPeerLeft;
  }

  private setupConnectionHandlers(conn: DataConnection): void {
    const remote = conn.peer;
    this.connections.set(remote, conn);

    conn.on("data", (raw) => {
      try {
        const parsed: PeerMessage = typeof raw === "string" ? JSON.parse(raw) : raw;
        // Handle control messages
        if ("__control" in parsed) {
          switch (parsed.__control) {
            case "join": {
              if (this.isHost && this.peer) {
                const newPeer = parsed.peerId;
                const userData = parsed.userData;
                const currentCount = this.connections.size + 1;
                if (currentCount > this.maxParticipants) {
                  conn.send(JSON.stringify({ __control: "reject", reason: "room_full" }));
                  conn.close();
                  this.connections.delete(remote);
                  return;
                }
                
                // Store user data if provided
                if (userData) {
                  this.usersData.set(newPeer, userData);
                }
                
                const existing = Array.from(this.connections.keys()).filter((p) => p !== newPeer);
                const hostId = this.peer.id;
                
                // Get all existing user data to send to the new peer
                const existingUsersData = Array.from(this.usersData.values());
                
                // Send peer list with existing user data to the new peer
                conn.send(JSON.stringify({ 
                  __control: "peer-list", 
                  peers: [hostId, ...existing],
                  usersData: existingUsersData
                }));

                // Notify existing peers about new peer with user data
                for (const [pid, c] of this.connections.entries()) {
                  if (pid === newPeer) continue;
                  try {
                    c.send(JSON.stringify({ __control: "new-peer", peerId: newPeer, userData }));
                  } catch (e) {
                    console.warn("failed to notify existing peer", pid, e);
                  }
                }
                
                // Notify about user data if provided
                if (userData && this.onUserDataUpdate) {
                  this.onUserDataUpdate(userData);
                }
                
                this.onPeerListUpdate([...(existing ?? []), hostId, newPeer]);
              }
              break;
            }
            case "peer-list": {
              const list: PeerId[] = parsed.peers || [];
              const usersData: UserData[] = parsed.usersData || [];
              if (usersData.length > 0 && this.onUserListUpdate) {
                this.onUserListUpdate(usersData);
              }
              this.onPeerListUpdate(list);
              break;
            }
            case "new-peer": {
              const newPeerId = parsed.peerId;
              const userData = parsed.userData;
              
              // Store user data if provided
              if (userData) {
                this.usersData.set(newPeerId, userData);
              }
              
              // Notify about user data if provided
              if (userData && this.onUserDataUpdate) {
                this.onUserDataUpdate(userData);
              }
              
              if (!this.connections.has(newPeerId) && this.peer && this.peer.id !== newPeerId) {
                try {
                  const dc = this.peer.connect(newPeerId, { reliable: true });
                  dc.on("open", () => this.setupConnectionHandlers(dc));
                  dc.on("error", (e) => this.onError(e));
                } catch (e) {
                  console.warn("could not connect to new peer", newPeerId, e);
                }
              }
              break;
            }
            case "user-update": {
              const userData = parsed.userData;
              if (userData) {
                // Store the updated user data
                this.usersData.set(userData.id, userData);
                
                if (this.onUserDataUpdate) {
                  this.onUserDataUpdate(userData);
                }
              }
              break;
            }
            case "peer-left": {
              const leftPeerId = parsed.peerId;
              if (leftPeerId) {
                // Remove from connections and user data
                this.connections.delete(leftPeerId);
                this.usersData.delete(leftPeerId);
                
                // Notify about peer leaving
                if (this.onPeerLeft) {
                  this.onPeerLeft(leftPeerId);
                }
                
                // Update peer list
                const remainingPeers = Array.from(this.connections.keys());
                if (this.isHost && this.peer) {
                  remainingPeers.push(this.peer.id);
                }
                this.onPeerListUpdate(remainingPeers);
              }
              break;
            }
            case "reject": {
              this.onError({ type: "reject", reason: parsed.reason });
              break;
            }
          }
        } else {
          // Otherwise, treat as a normal message
          const msg: RoomMessage = {
            from: conn.peer,
            type: parsed.type,
            payload: parsed.payload,
            timestamp: parsed.timestamp ?? Date.now(),
          };
          this.onMessage(msg);
        }
      } catch {
        // If not JSON, ignore or forward raw as payload
        const msg: RoomMessage = {
          from: conn.peer,
          payload: raw,
          timestamp: Date.now(),
        };
        this.onMessage(msg);
      }
    });

    conn.on("close", () => {
      // Clean up connection and user data
      this.connections.delete(remote);
      this.usersData.delete(remote);
      
      // Notify other peers if this is the host
      if (this.isHost) {
        this.notifyPeerLeft(remote);
      }
      
      // Update peer list
      const remainingPeers = Array.from(this.connections.keys());
      if (this.isHost && this.peer) {
        remainingPeers.push(this.peer.id);
      }
      this.onPeerListUpdate(remainingPeers);
      
      // Notify about peer leaving
      if (this.onPeerLeft) {
        this.onPeerLeft(remote);
      }
    });

    conn.on("error", (e) => {
      console.warn("Connection error with peer", remote, e);
      // Clean up on error
      this.connections.delete(remote);
      this.usersData.delete(remote);
      
      // Notify other peers if this is the host
      if (this.isHost) {
        this.notifyPeerLeft(remote);
      }
      
      // Update peer list
      const remainingPeers = Array.from(this.connections.keys());
      if (this.isHost && this.peer) {
        remainingPeers.push(this.peer.id);
      }
      this.onPeerListUpdate(remainingPeers);
      
      // Notify about peer leaving
      if (this.onPeerLeft) {
        this.onPeerLeft(remote);
      }
      
      this.onError(e);
    });
  }

  async createHost(roomId: string, peerOptions?: PeerJSOption): Promise<void> {
    if (typeof window === "undefined") throw new Error("createHost must run on client-side");
    if (this.peer) this.destroy();
    this.isHost = true;
    this.roomId = roomId;

    this.peer = new Peer(roomId, peerOptions);

    return new Promise<void>((resolve, reject) => {
      if (!this.peer) return reject(new Error("Peer not initialized"));
      this.peer.on("open", (id) => {
        this.onPeerListUpdate([id]);
        resolve();
      });

      this.peer.on("connection", (conn) => {
        conn.on("open", () => {
          this.setupConnectionHandlers(conn);
        });
        conn.on("error", (e) => this.onError(e));
      });

      this.peer.on("error", (e) => {
        this.onError(e);
        reject(e);
      });
    });
  }

  async joinRoom(roomId: string, localId?: PeerId, peerOptions?: PeerJSOption): Promise<void> {
    if (typeof window === "undefined") throw new Error("joinRoom must run on client-side");
    if (this.peer) this.destroy();
    this.isHost = false;
    this.roomId = roomId;

    if (localId) {
      this.peer = peerOptions ? new Peer(localId, peerOptions) : new Peer(localId);
    } else {
      this.peer = peerOptions ? new Peer(peerOptions) : new Peer();
    }

    return new Promise<void>((resolve, reject) => {
      if (!this.peer) return reject(new Error("Peer not initialized"));
      this.peer.on("open", (id) => {
        const conn = this.peer!.connect(roomId, { reliable: true });
        conn.on("open", () => {
          conn.send(JSON.stringify({ __control: "join", peerId: id }));
          this.setupConnectionHandlers(conn);
          resolve();
        });
        conn.on("error", (e) => {
          this.onError(e);
          reject(e);
        });
      });

      this.peer.on("connection", (conn) => {
        conn.on("open", () => this.setupConnectionHandlers(conn));
        conn.on("error", (e) => this.onError(e));
      });

      this.peer.on("error", (e) => {
        this.onError(e);
        reject(e);
      });
    });
  }

  sendToAll(payload: unknown, type?: string): void {
    const packet = JSON.stringify({ type, payload, timestamp: Date.now() });
    for (const [, conn] of this.connections.entries()) {
      if (conn.open) {
        try {
          conn.send(packet);
        } catch (e) {
          console.warn("failed to send to", conn.peer, e);
        }
      }
    }
  }

  sendToPeer(peerId: PeerId, payload: unknown, type?: string): void {
    const conn = this.connections.get(peerId);
    if (!conn) throw new Error(`No connection to peer ${peerId}`);
    const packet = JSON.stringify({ type, payload, timestamp: Date.now() });
    conn.send(packet);
  }

  listPeers(): PeerId[] {
    const peers = Array.from(this.connections.keys());
    if (this.isHost && this.roomId) {
      peers.push(this.roomId);
    }
    return peers;
  }

  // Set local user data (for host or when user completes setup)
  setUserData(userData: UserData): void {
    if (this.peer && userData.id === this.peer.id) {
      this.usersData.set(userData.id, userData);
    }
  }

  // Notify all peers that someone left
  private notifyPeerLeft(leftPeerId: PeerId): void {
    const packet = JSON.stringify({ __control: "peer-left", peerId: leftPeerId });
    for (const [, conn] of this.connections.entries()) {
      if (conn.open) {
        try {
          conn.send(packet);
        } catch (e) {
          console.warn("failed to notify peer about left peer", conn.peer, e);
        }
      }
    }
  }

  // Send user data update to all connected peers
  broadcastUserData(userData: UserData): void {
    // Store locally first
    this.setUserData(userData);
    
    const packet = JSON.stringify({ __control: "user-update", userData });
    for (const [, conn] of this.connections.entries()) {
      if (conn.open) {
        try {
          conn.send(packet);
        } catch (e) {
          console.warn("failed to send user data to", conn.peer, e);
        }
      }
    }
  }

  // Join room with user data
  async joinRoomWithUserData(roomId: string, userData: UserData, localId?: PeerId, peerOptions?: PeerJSOption): Promise<void> {
    if (typeof window === "undefined") throw new Error("joinRoomWithUserData must run on client-side");
    if (this.peer) this.destroy();
    this.isHost = false;
    this.roomId = roomId;

    if (localId) {
      this.peer = peerOptions ? new Peer(localId, peerOptions) : new Peer(localId);
    } else {
      this.peer = peerOptions ? new Peer(peerOptions) : new Peer();
    }

    return new Promise<void>((resolve, reject) => {
      if (!this.peer) return reject(new Error("Peer not initialized"));
      this.peer.on("open", (id) => {
        const conn = this.peer!.connect(roomId, { reliable: true });
        conn.on("open", () => {
          // Include user data in join message
          conn.send(JSON.stringify({ __control: "join", peerId: id, userData }));
          this.setupConnectionHandlers(conn);
          resolve();
        });
        conn.on("error", (e) => {
          this.onError(e);
          reject(e);
        });
      });

      this.peer.on("connection", (conn) => {
        conn.on("open", () => this.setupConnectionHandlers(conn));
        conn.on("error", (e) => this.onError(e));
      });

      this.peer.on("error", (e) => {
        this.onError(e);
        reject(e);
      });
    });
  }

  // Gracefully leave the room and notify others
  leaveRoom(): void {
    if (this.peer) {
      // Notify others that we're leaving
      if (this.isHost) {
        // Host leaving - notify all peers
        const packet = JSON.stringify({ __control: "peer-left", peerId: this.peer.id });
        for (const [, conn] of this.connections.entries()) {
          if (conn.open) {
            try {
              conn.send(packet);
            } catch (e) {
              console.warn("failed to notify peer about host leaving", conn.peer, e);
            }
          }
        }
      } else {
        // Regular peer leaving - notify host
        for (const [, conn] of this.connections.entries()) {
          if (conn.open) {
            try {
              const packet = JSON.stringify({ __control: "peer-left", peerId: this.peer.id });
              conn.send(packet);
            } catch (e) {
              console.warn("failed to notify about leaving", e);
            }
          }
        }
      }
    }
    
    // Clean up after a short delay to ensure messages are sent
    setTimeout(() => {
      this.destroy();
    }, 100);
  }

  destroy(): void {
    try {
      for (const conn of this.connections.values()) {
        try {
          conn.close();
        } catch (e) {
          console.warn("Error closing connection:", e);
        }
      }
      this.connections.clear();
      this.usersData.clear(); // Clear user data registry
      if (this.peer) {
        try {
          this.peer.destroy();
        } catch (e) {
          console.warn("Error destroying peer:", e);
        }
        this.peer = null;
      }
    } catch (e) {
      console.warn("Error destroying peer manager", e);
    }
  }
}

/*********************** React Hook: useRoom ************************/

export const useRoom = (opts?: { maxParticipants?: number }) => {
  const store = useRoomStore();
  const managerRef = useRef<PeerManager | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    return () => {
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, []);

  const ensureManager = useCallback((): PeerManager => {
    if (!managerRef.current) {
      managerRef.current = new PeerManager({
        maxParticipants: opts?.maxParticipants ?? 4,
        onPeerListUpdate: (peers) => {
          store.setRoomId(useRoomStore.getState().roomId ?? null);
          store.setIsHost(managerRef.current?.isHost ?? false);
          store.setLocalPeerId(managerRef.current?.peer?.id ?? null);
          const list = Array.from(new Set(peers));
          const local = managerRef.current?.peer?.id;
          if (local && !list.includes(local)) {
            list.push(local);
          }
          store.addParticipant(local ?? "");
          list.forEach((participant) => {
            if (participant !== (local ?? "")) {
              store.addParticipant(participant);
            }
          });
        },
        onMessage: (m) => {
          store.addMessage(m);
        },
        onError: (e) => setError(e),
        onPeerLeft: (peerId) => {
          // Remove peer from the old store as well
          store.removeParticipant(peerId);
        },
      });
    }
    return managerRef.current;
  }, [opts?.maxParticipants, store]);

  const createRoom = useCallback(async (roomId?: string): Promise<string> => {
    if (typeof window === "undefined") {
      throw new Error("createRoom must be called client-side");
    }
    setLoading(true);
    setError(null);
    const id = roomId ?? createRoomId();
    store.setRoomId(id);
    const mgr = ensureManager();
    try {
      await mgr.createHost(id);
      store.setIsHost(true);
      store.setLocalPeerId(mgr.peer?.id ?? null);
      store.addParticipant(mgr.peer?.id ?? id);
      setLoading(false);
      return id;
    } catch (e) {
      setError(e);
      setLoading(false);
      throw e;
    }
  }, [ensureManager, store]);

  const joinRoom = useCallback(async (roomId: string, preferredId?: string): Promise<void> => {
    if (typeof window === "undefined") {
      throw new Error("joinRoom must be called client-side");
    }
    setLoading(true);
    setError(null);
    store.setRoomId(roomId);
    const mgr = ensureManager();
    try {
      await mgr.joinRoom(roomId, preferredId);
      store.setIsHost(false);
      store.setLocalPeerId(mgr.peer?.id ?? null);
      if (mgr.peer?.id) {
        store.addParticipant(mgr.peer.id);
      }
      setLoading(false);
    } catch (e) {
      setError(e);
      setLoading(false);
      throw e;
    }
  }, [ensureManager, store]);

  const sendObject = useCallback((obj: unknown, type?: string): void => {
    const mgr = managerRef.current;
    if (!mgr) {
      throw new Error("Not connected to a room");
    }
    mgr.sendToAll(obj, type);
    const localId = mgr.peer?.id ?? "local";
    const m: RoomMessage = { from: localId, type, payload: obj, timestamp: Date.now() };
    useRoomStore.getState().addMessage(m);
  }, []);

  const leaveRoom = useCallback((): void => {
    const mgr = managerRef.current;
    if (mgr) {
      mgr.leaveRoom();
      managerRef.current = null;
    }
    useRoomStore.setState({ localPeerId: null, isHost: false, roomId: null, participants: [], messages: [] });
  }, []);

  // New method for broadcasting user data
  const broadcastUserData = useCallback((userData: UserData): void => {
    const mgr = managerRef.current;
    if (!mgr) {
      throw new Error("Not connected to a room");
    }
    mgr.broadcastUserData(userData);
  }, []);

  return {
    createRoom,
    joinRoom,
    sendObject,
    leaveRoom,
    broadcastUserData,
    participants: useRoomStore((s) => s.participants),
    messages: useRoomStore((s) => s.messages),
    localPeerId: useRoomStore((s) => s.localPeerId),
    isHost: useRoomStore((s) => s.isHost),
    roomId: useRoomStore((s) => s.roomId),
    loading,
    error,
  };
};