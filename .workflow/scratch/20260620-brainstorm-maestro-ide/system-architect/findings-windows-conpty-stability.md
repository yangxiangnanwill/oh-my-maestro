# Finding: Windows ConPTY Stability Risk

> Role: system-architect | Impact: MEDIUM

## Description

The design research notes that `node-pty` on Windows uses conpty, which has known quirks including line-ending differences, limited color support, and resize event handling issues. Since the product targets developers on all platforms (guidance section 1 implies cross-platform via local web app), Windows compatibility is a first-class concern.

The PTY Manager (F-004) and Approval Gate (F-007) both rely on PTY flow control that may behave differently on Windows. Specifically, SIGTSTP/SIGCONT for pausing processes is unreliable under conpty, and process signal handling differs between Unix and Windows.

## Affected Features

- F-004 (Terminal Bridge): Direct node-pty dependency; resize and signal handling must be tested on Windows.
- F-007 (Approval Gate): Process pause/resume mechanism may need a Windows-specific implementation.

## Recommendation

Implement platform-specific PTY control strategies: on Unix, use SIGTSTP/SIGCONT for process pause; on Windows, use a different mechanism such as buffering output and withholding input rather than suspending the process. Add a Windows CI pipeline that runs all PTY-related integration tests. Document platform-specific behavior differences in the adapter layer.
