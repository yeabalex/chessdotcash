"use client";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useContext, useState } from "react";
import { SessionContext } from "@/context/session";
import { createGame } from "@/lib/game";

export default function CreateGame() {
  const session = useContext(SessionContext);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [customBid, setCustomBid] = useState("");
  const [selectedBid, setSelectedBid] = useState("");
  const [customBidError, setCustomBidError] = useState("");
  const router = useRouter();

  const predefinedBids = [50, 100, 200, 400, 800, 1200, 1600, 2000];
  const MIN_BID = 50;

  async function submitCreateGame(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.user?.id) return;
    
    // Validate custom bid amount
    if (selectedBid === "custom") {
      const bidValue = parseFloat(customBid);
      if (isNaN(bidValue) || bidValue < MIN_BID) {
        setCustomBidError(`Minimum bid amount is $${MIN_BID}`);
        return;
      }
    }
    
    setButtonLoading(true);
    
    const target = e.target as HTMLFormElement;
    const unlisted = target.elements.namedItem("createUnlisted") as HTMLInputElement;
    const startingSide = (target.elements.namedItem("createStartingSide") as HTMLSelectElement).value;
    
    // Determine the bid amount
    const bidAmount = selectedBid === "custom" 
      ? parseFloat(customBid) 
      : selectedBid 
        ? parseFloat(selectedBid) 
        : 0;
    
    const game = await createGame(startingSide, unlisted.checked, bidAmount);
    
    if (game) {
      router.push(`/${game.code}`);
    } else {
      setButtonLoading(false);
      // TODO: Show error message
    }
  }

  const handleBidSelection = (value: string) => {
    setSelectedBid(value);
    setCustomBidError("");
    if (value !== "custom") {
      setCustomBid("");
    }
  };

  const handleCustomBidChange = (value: string) => {
    setCustomBid(value);
    setCustomBidError("");
    
    // Validate as user types
    if (value) {
      const bidValue = parseFloat(value);
      if (isNaN(bidValue) || bidValue < MIN_BID) {
        setCustomBidError(`Minimum bid amount is $${MIN_BID}`);
      }
    }
  };

  return (
    <form className="form-control" onSubmit={submitCreateGame}>
      <label className="label cursor-pointer">
        <span className="label-text">Unlisted/invite-only</span>
        <input type="checkbox" className="checkbox" name="createUnlisted" id="createUnlisted" />
      </label>
      
      <label className="label" htmlFor="createStartingSide">
        <span className="label-text">Select your side</span>
      </label>
      <div className="input-group mb-4">
        <select
          className="select select-bordered"
          name="createStartingSide"
          id="createStartingSide"
        >
          <option value="random">Random</option>
          <option value="white">White</option>
          <option value="black">Black</option>
        </select>
      </div>
      
      <div className="mb-4">
        <label className="label">
          <span className="label-text">Bid Amount (USD)</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {predefinedBids.map((bid) => (
            <button
              key={bid}
              type="button"
              className={`btn ${selectedBid === bid.toString() ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleBidSelection(bid.toString())}
            >
              ${bid}
            </button>
          ))}
          <button
            type="button"
            className={`btn ${selectedBid === "custom" ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleBidSelection("custom")}
          >
            Custom
          </button>
        </div>
        
        {selectedBid === "custom" && (
          <div className="form-control">
            <label className="input-group">
              <span>$</span>
              <input
                type="number"
                placeholder={`Enter amount (min $${MIN_BID})`}
                className={`input input-bordered w-full ${customBidError ? 'input-error' : ''}`}
                value={customBid}
                onChange={(e) => handleCustomBidChange(e.target.value)}
                min={MIN_BID}
                step="1"
                required
              />
              <span>USD</span>
            </label>
            {customBidError && (
              <div className="text-error text-sm mt-1">{customBidError}</div>
            )}
          </div>
        )}
      </div>
      
      <button
        className={
          "btn w-full" +
          (buttonLoading ? " loading" : "") +
          (!session?.user?.id ? " btn-disabled text-base-content" : "")
        }
        type="submit"
        disabled={
          !session?.user?.id || 
          (selectedBid === "custom" && (!customBid || !!customBidError)) ||
          !selectedBid
        }
      >
        Create Game
      </button>
    </form>
  );
}