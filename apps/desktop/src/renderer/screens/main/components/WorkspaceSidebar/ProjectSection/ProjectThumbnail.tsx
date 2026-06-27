// Stub: ProjectThumbnail component for NewWorkspaceModal
// Renders a small project icon/thumbnail using the project's color.
import { cn } from "renderer/components/Chat/stubs/ui/utils";

interface ProjectThumbnailProps {
  projectId?: string;
  projectName?: string;
  projectColor?: string;
  githubOwner?: string | null;
  iconUrl?: string | null;
  hideImage?: boolean;
  className?: string;
}

export function ProjectThumbnail({
  projectId,
  projectName,
  projectColor,
  githubOwner,
  iconUrl,
  hideImage,
  className,
}: ProjectThumbnailProps) {
  const displayChar = (projectName ?? "?").charAt(0).toUpperCase();

  if (iconUrl && !hideImage) {
    return (
      <img
        src={iconUrl}
        alt={projectName ?? ""}
        className={cn("size-4 rounded-sm object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex size-4 items-center justify-center rounded-sm text-[10px] font-bold text-white shrink-0",
        className,
      )}
      style={{ backgroundColor: projectColor ?? "#6b7280" }}
    >
      {displayChar}
    </div>
  );
}
