"use client";

import { useState, useEffect } from "react";
import { fetchPublicGames } from "@/lib/game";
import JoinButton from "./JoinButton";
import { Game, User } from "@chessu/types"; // Assuming types are in this path

export default function PublicGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<string>("none");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const loadGames = async () => {
      setLoading(true);
      const fetchedGames = await fetchPublicGames();
      setGames(fetchedGames || []);
      setLoading(false);
    };
    
    loadGames();
  }, []);

  const refreshGames = async () => {
    setLoading(true);
    const fetchedGames = await fetchPublicGames();
    setGames(fetchedGames || []);
    setLoading(false);
  };

  // Calculate win rate
  const calculateWinRate = (user?: User): { rate: number, display: string } => {
    if (!user || user.wins === undefined || user.losses === undefined) {
      return { rate: 0, display: "N/A" };
    }
    
    const totalGames = user.wins + user.losses;
    if (totalGames === 0) {
      return { rate: 0, display: "0%" };
    }
    
    const winRate = (user.wins / totalGames) * 100;
    return { 
      rate: winRate, 
      display: `${winRate.toFixed(1)}%`
    };
  };

  // Format bid amount
  const formatBid = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get game status
  const getGameStatus = (game: Game) => {
    if (game.endedAt) {
      return "Completed";
    } else if (game.startedAt) {
      return "In Progress";
    } else {
      return "Waiting";
    }
  };

  // Sort games
  const handleSort = (key: string) => {
    if (sortKey === key) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new sort key and default direction
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortedGames = [...games].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    
    switch (sortKey) {
      case "bidAmount": 
        return (a.bidAmount - b.bidAmount) * direction;
      
      case "hostWinRate": {
        const aRate = calculateWinRate(a.host).rate;
        const bRate = calculateWinRate(b.host).rate;
        return (aRate - bRate) * direction;
      }
      
      case "opponentWinRate": {
        const aOpponent = a.host?.id === a.white?.id ? a.black : a.white;
        const bOpponent = b.host?.id === b.white?.id ? b.black : b.white;
        const aRate = calculateWinRate(aOpponent).rate;
        const bRate = calculateWinRate(bOpponent).rate;
        return (aRate - bRate) * direction;
      }
      
      case "status": {
        const statusOrder = { "Waiting": 0, "In Progress": 1, "Completed": 2 };
        const aStatus = getGameStatus(a);
        const bStatus = getGameStatus(b);
        return (statusOrder[aStatus as keyof typeof statusOrder] - 
                statusOrder[bStatus as keyof typeof statusOrder]) * direction;
      }
      
      default:
        return 0;
    }
  });

  return (
    <div className="flex flex-col w-full px-2">
      <div className="flex justify-between items-center w-full mb-3">
        <h2 className="text-xl font-bold leading-tight">
          Public Games
        </h2>
        <button 
          onClick={refreshGames} 
          className="btn btn-sm btn-primary flex items-center gap-1"
          disabled={loading}
        >
          {loading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Refresh
        </button>
      </div>
      
      {/* Sort controls - MOBILE FOCUSED */}
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="text-sm font-medium">Sort by:</div>
        {[
          { key: "bidAmount", label: "Bid" },
          { key: "hostWinRate", label: "Host Win %" },
          { key: "opponentWinRate", label: "Opponent Win %" },
          { key: "status", label: "Status" }
        ].map((option) => (
          <button
            key={option.key}
            onClick={() => handleSort(option.key)}
            className={`btn btn-xs ${sortKey === option.key ? 'btn-accent' : 'btn-outline'}`}
          >
            {option.label}
            {sortKey === option.key && (
              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
            )}
          </button>
        ))}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : sortedGames.length > 0 ? (
        <div className="space-y-3 pb-4">
          {sortedGames.map((game) => {
            const gameStatus = getGameStatus(game);
            const opponentUser = game.host?.id === game.white?.id ? game.black : game.white;
            const hostWinRate = calculateWinRate(game.host);
            const opponentWinRate = calculateWinRate(opponentUser);
            
            return (
              <div 
                key={game.code} 
                className="bg-base-200 rounded-lg p-3 shadow-sm"
              >
                {/* Game Status Header */}
                <div className="flex justify-between items-center mb-2">
                  <span className={`badge ${
                    gameStatus === "In Progress" ? "badge-warning" :
                    gameStatus === "Completed" ? "badge-secondary" : "badge-info"
                  }`}>
                    {gameStatus}
                  </span>
                  
                  <div className={`font-semibold ${game.bidAmount > 0 ? "text-accent" : "opacity-70"}`}>
                    {game.bidAmount > 0 ? formatBid(game.bidAmount) : "Free"}
                  </div>
                </div>
                
                {/* Players Info */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {/* Host */}
                  <div className="bg-base-300 p-2 rounded-md">
                    <div className="text-xs uppercase opacity-60">Host</div>
                    <div className={`font-medium ${typeof game.host?.id === "number" ? "text-primary" : ""}`}>
                      {game.host?.name || "Anonymous"}
                    </div>
                    <div className="flex items-center text-xs">
                      <span className="mr-2 opacity-70">
                        {game.host?.id === game.white?.id ? "White" : "Black"}
                      </span>
                      <span className="badge badge-sm badge-outline">
                        {hostWinRate.display}
                      </span>
                    </div>
                  </div>
                  
                  {/* Opponent */}
                  <div className="bg-base-300 p-2 rounded-md">
                    <div className="text-xs uppercase opacity-60">Opponent</div>
                    <div className={`font-medium ${typeof opponentUser?.id === "number" ? "text-primary" : ""}`}>
                      {opponentUser?.name || "-"}
                    </div>
                    {opponentUser?.name && (
                      <div className="flex items-center text-xs">
                        <span className="mr-2 opacity-70">
                          {opponentUser?.id === game.white?.id ? "White" : "Black"}
                        </span>
                        <span className="badge badge-sm badge-outline">
                          {opponentWinRate.display}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Time and Join Button */}
                <div className="flex justify-between items-center">
                  <div className="text-sm opacity-70">
                    {game.timeout ? `Time: ${game.timeout / 60000}m` : "No time limit"}
                  </div>
                  
                  {gameStatus !== "Completed" && (
                    <JoinButton code={game.code as string} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-base-200 rounded-lg p-6 text-center">
          <p className="text-base-content opacity-70">No public games available</p>
        </div>
      )}
      
      {/* Desktop view */}
      <div className="hidden md:block mt-4">
        <div className="bg-base-200 rounded-xl shadow-lg overflow-hidden w-full">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead className="bg-base-300">
                <tr>
                  <th onClick={() => handleSort("hostWinRate")} className="cursor-pointer">
                    Host
                    {sortKey === "hostWinRate" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                  <th onClick={() => handleSort("opponentWinRate")} className="cursor-pointer">
                    Opponent
                    {sortKey === "opponentWinRate" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                  <th onClick={() => handleSort("bidAmount")} className="cursor-pointer">
                    Bid Amount
                    {sortKey === "bidAmount" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                  <th onClick={() => handleSort("status")} className="cursor-pointer">
                    Status
                    {sortKey === "status" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                  <th>Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedGames.map((game) => {
                  const gameStatus = getGameStatus(game);
                  const opponentUser = game.host?.id === game.white?.id ? game.black : game.white;
                  const hostWinRate = calculateWinRate(game.host);
                  const opponentWinRate = calculateWinRate(opponentUser);
                  
                  return (
                    <tr key={`table-${game.code}`}>
                      <td>
                        <div className="flex flex-col">
                          <span className={typeof game.host?.id === "number" ? "text-primary font-medium" : ""}>
                            {game.host?.name || "Anonymous"}
                            <span className="ml-1 text-xs opacity-70">
                              ({game.host?.id === game.white?.id ? "White" : "Black"})
                            </span>
                          </span>
                          <span className="text-xs text-opacity-80 text-base-content">
                            Win rate: {hostWinRate.display}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className={typeof opponentUser?.id === "number" ? "text-primary font-medium" : ""}>
                            {opponentUser?.name || "-"}
                          </span>
                          {opponentUser?.name && (
                            <span className="text-xs text-opacity-80 text-base-content">
                              Win rate: {opponentWinRate.display}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`${game.bidAmount > 0 ? "font-medium text-accent" : "opacity-70"}`}>
                          {game.bidAmount > 0 ? formatBid(game.bidAmount) : "Free"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          gameStatus === "In Progress" ? "badge-warning" :
                          gameStatus === "Completed" ? "badge-secondary" : "badge-info"
                        }`}>
                          {gameStatus}
                        </span>
                      </td>
                      <td>
                        {game.timeout ? `${game.timeout / 60000}m` : "-"}
                      </td>
                      <td>
                        {gameStatus !== "Completed" && (
                          <JoinButton code={game.code as string} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}