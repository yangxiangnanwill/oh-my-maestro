// Stub: renderer/screens/main/components/IssueIcon/IssueIcon
// Renders a small GitHub-style issue icon.
import { GoIssueClosed, GoIssueOpened } from "react-icons/go";

export type IssueState = "open" | "closed";

interface IssueIconProps {
  state: IssueState;
  className?: string;
}

export function IssueIcon({ state, className }: IssueIconProps) {
  if (state === "closed") {
    return <GoIssueClosed className={className} />;
  }
  return <GoIssueOpened className={className} />;
}
