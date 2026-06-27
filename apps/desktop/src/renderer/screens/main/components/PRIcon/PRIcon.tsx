// Stub: renderer/screens/main/components/PRIcon/PRIcon
// Renders a small GitHub-style PR icon.
import { GoGitMerge, GoGitPullRequest } from "react-icons/go";

export type PRState = "open" | "closed" | "merged";

interface PRIconProps {
  state: PRState;
  className?: string;
}

export function PRIcon({ state, className }: PRIconProps) {
  if (state === "merged") {
    return <GoGitMerge className={className} />;
  }
  if (state === "closed") {
    return <GoGitPullRequest className={className} />;
  }
  return <GoGitPullRequest className={className} />;
}
