"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal-store";
import Image from "next/image";
import { useUser } from "@clerk/nextjs"; 

interface Server {
  id: string;
  name: string;
  imageUrl: string;
  inviteCode: string;
}

export function SearchServerModal() {
  const { isOpen, onClose, type } = useModal();
  const isModalOpen = isOpen && type === "searchServer";

  const [searchQuery, setSearchQuery] = useState("");
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [recommendations, setRecommendations] = useState<Server[]>([]);

  const { user } = useUser(); 

  useEffect(() => {
    if (!isModalOpen || !user?.id) return;

    const fetchAndTrainData = async () => {
      setLoadingRecommendations(true);
      try {
        const { data: serverData } = await axios.get("/api/info");

        // Train model
        const trainResponse = await axios.post("https://connecteamserver.onrender.com/train", serverData);

        if (trainResponse.status === 200) {
          // Fetch recommendations
          const recommendResponse = await axios.post("https://connecteamserver.onrender.com/recommend", {
            user_id: user.id,
          });

          // Map data to `Server` interface
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const recommendedServers: Server[] = recommendResponse.data.map((rec: any) => ({
            id: rec.server_id,
            name: rec.server_name,
            imageUrl: rec.server_image,
            inviteCode: rec.server_invite,
          }));

          setRecommendations(recommendedServers);
        }
      } catch (error) {
        console.error("Failed to train or fetch recommendations:", error);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchAndTrainData();
  }, [isModalOpen]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setServers(recommendations);
      return;
    }

    const fetchServers = async () => {
      setLoading(true);
      try {
        const response = await axios.get<Server[]>(`/api/search?q=${searchQuery}`);
        setServers(response.data);
      } catch (error) {
        console.error("Failed to search servers:", error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchServers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, recommendations]);

  const handleJoinServer = (server: Server) => {
    setSelectedServer(server);
  };

  const confirmJoinServer = () => {
    if (selectedServer) {
      const url = `/invite/${selectedServer.inviteCode}`;
      window.open(url, "_blank");
      setSelectedServer(null);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setServers([]);
    setSelectedServer(null);
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Search for a Server
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            Find and join servers that match your interests.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-4">
          {loadingRecommendations && (
            <p className="text-center text-zinc-500">Loading recommendations...</p>
          )}
          <Input
            placeholder="Search by server name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white text-black"
          />
          {loading ? (
            <p className="text-center text-zinc-500">Searching...</p>
          ) : (
            <ul className="space-y-2">
              {(searchQuery.trim() ? servers : recommendations).map((server) => (
                <li
                  key={server.id}
                  className="flex items-center space-x-4 p-2 border rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => handleJoinServer(server)}
                >
                  <Image
                    src={server.imageUrl}
                    alt={server.name}
                    className="w-10 h-10 rounded-full"
                    width={25}
                    height={25}
                  />
                  <span className="text-lg font-medium">{server.name}</span>
                </li>
              ))}
              {servers.length === 0 && searchQuery.trim() && (
                <p className="text-center text-zinc-500">No servers found.</p>
              )}
            </ul>
          )}
        </div>
        {selectedServer && (
          <Dialog open={true} onOpenChange={() => setSelectedServer(null)}>
            <DialogContent className="bg-white text-black p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-center">
                  Join Server
                </DialogTitle>
              </DialogHeader>
              <p className="text-center text-zinc-500">
                Do you want to join the server <strong>{selectedServer.name}</strong>?
              </p>
              <DialogFooter className="mt-4 flex justify-center space-x-4">
                <Button variant="secondary" onClick={() => setSelectedServer(null)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={confirmJoinServer}>
                  Join
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        <DialogFooter className="bg-gray-100 px-6 py-4">
          <Button variant="primary" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
