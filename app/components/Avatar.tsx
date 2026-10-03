type AvatarProps = {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
};

const getInitials = (name?: string) => {
  const words = (name || "User").trim().split(/\s+/).filter(Boolean);
  return (
    words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "U"
  );
};

export default function Avatar({
  name,
  src,
  size = "md",
  className = "",
}: AvatarProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border border-[#cfe2f8] bg-[#eff6ff] font-bold text-[#2f80ed] dark:border-[#31516e] dark:bg-[#173452] dark:text-[#b7d8ff] ${sizeClasses[size]} ${className}`}
      aria-label={`${name || "User"} avatar`}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
