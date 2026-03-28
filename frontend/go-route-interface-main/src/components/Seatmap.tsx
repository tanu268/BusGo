import { useState, useEffect } from "react";

interface SeatMapProps {
  totalSeats: number;
  bookedSeats: number[];
  onSelect: (seat: number) => void;
}

export default function SeatMap({ totalSeats, bookedSeats, onSelect }: SeatMapProps) {

  const [selected, setSelected] = useState<number | null>(null);

  // Convert booked seats array to Set for faster lookup
  const bookedSet = new Set(bookedSeats);

  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1);

  // Reset selected seat if it becomes booked
  useEffect(() => {
    if (selected && bookedSet.has(selected)) {
      setSelected(null);
    }
  }, [bookedSeats]);

  function handleClick(seat: number) {

    if (bookedSet.has(seat)) return;

    setSelected(seat);
    onSelect(seat);
  }

  return (
    <div className="flex flex-col items-center gap-2">

      {/* Seat Grid */}
      <div className="grid grid-cols-4 gap-2 max-h-[260px] overflow-y-auto p-2 border rounded-md">

        {seats.map((seat) => {

          const isBooked = bookedSet.has(seat);
          const isSelected = selected === seat;

          return (
            <button
              key={seat}
              onClick={() => handleClick(seat)}
              disabled={isBooked}
              className={`h-9 w-9 text-xs rounded-md font-semibold text-white
                ${
                  isBooked
                    ? "bg-red-500 cursor-not-allowed"
                    : isSelected
                    ? "bg-blue-500"
                    : "bg-green-500 hover:bg-green-600"
                }
              `}
            >
              {seat}
            </button>
          );
        })}

      </div>

      {/* Seat Legend */}
      <div className="flex gap-4 text-xs mt-2">

        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Available</span>
        </div>

        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Booked</span>
        </div>

        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Selected</span>
        </div>

      </div>

    </div>
  );
}