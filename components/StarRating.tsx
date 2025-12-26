"use client";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  editable?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function StarRating({ 
  rating, 
  onRatingChange, 
  editable = false,
  size = "md" 
}: StarRatingProps) {
  
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl"
  };

  const handleClick = (selectedRating: number) => {
    if (editable && onRatingChange) {
      onRatingChange(selectedRating);
    }
  };

  return (
    <div className="flex items-center">
      <div className={`flex ${sizes[size]}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            className={`${editable ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform ${
              star <= rating
                ? "text-yellow-500"
                : "text-gray-300"
            }`}
            disabled={!editable}
            aria-label={`${star} звезд`}
          >
            ★
          </button>
        ))}
      </div>
      {editable && (
        <span className="ml-3 text-lg font-bold text-gray-700">
          {rating}.0
        </span>
      )}
    </div>
  );
}