"use client";

interface GroupCardProps {
  group: {
    _id: string;
    name: string;
    description?: string;
    coverImage?: string;
    visibility?: 'public' | 'private';
    hasPassword?: boolean; // true if has password
    memberCount: number;
    role?: "owner" | "admin" | "member";
  };
  onClick: () => void;
}

export default function GroupCard({ group, onClick }: GroupCardProps) {
  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "member":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div
      onClick={onClick}
      className="group bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-border overflow-hidden hover:border-primary/30 hover:scale-[1.02]"
    >
      {/* Cover Image or Placeholder */}
      {group.coverImage ? (
        <div
          className="h-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${group.coverImage})` }}
        />
      ) : (
        <div className="h-40 bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <svg
            className="w-16 h-16 text-primary-foreground opacity-80"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold text-foreground truncate flex-1 group-hover:text-primary transition-colors">
            {group.name}
          </h3>
          {group.role && (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(
                group.role
              )}`}
            >
              {group.role}
            </span>
          )}
        </div>

        {group.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {group.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>{group.memberCount} {group.memberCount !== 1 ? "members" : "member"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {!group.hasPassword ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs">Public</span>
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span className="text-xs">Private</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

