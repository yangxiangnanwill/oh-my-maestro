// Stub: @superset/ui/ai-elements/prompt-input
import { createContext, type ReactNode } from "react";

export interface PromptInputMessage {
	text: string;
	files?: Array<{
		id: string;
		name: string;
		mediaType: string;
		url: string;
		filename?: string;
	}>;
}

export interface PromptInputProps {
	children?: ReactNode;
	className?: string;
	onSubmitStart?: () => void;
	onSubmitEnd?: () => void;
	onSubmit?:
		| ((message: PromptInputMessage) => Promise<void> | void)
		| ((message: {
				files: Array<{ url: string; mediaType: string; filename?: string }>;
		  }) => void);
	multiple?: boolean;
	maxFiles?: number;
	maxFileSize?: number;
	globalDrop?: boolean;
}

export function PromptInput(props: PromptInputProps) {
	return <div>{props.children}</div>;
}

export function PromptInputAttachment({
	data,
}: {
	data: { id: string; name: string; mediaType: string; url: string };
}) {
	return null;
}

export function PromptInputAttachments({
	children,
}: {
	children?:
		| ReactNode
		| ((file: {
				id: string;
				name: string;
				mediaType: string;
				url: string;
				filename?: string;
				type?: string;
				[key: string]: unknown;
		  }) => ReactNode);
}) {
	return null;
}

export function PromptInputButton({
	children,
	className,
	onClick,
}: {
	children?: ReactNode;
	className?: string;
	onClick?: () => void;
}) {
	return (
		<button type="button" className={className} onClick={onClick}>
			{children}
		</button>
	);
}

export function PromptInputFooter({ children }: { children: ReactNode }) {
	return <div>{children}</div>;
}

export function PromptInputSubmit({
	children,
	className,
	onClick,
	status,
	disabled,
}: {
	children?: ReactNode;
	className?: string;
	onClick?: (e: React.MouseEvent) => void;
	status?: string;
	disabled?: boolean;
}) {
	return (
		<button
			type="submit"
			className={className}
			onClick={onClick}
			disabled={disabled}
		>
			{children}
		</button>
	);
}

export function PromptInputTextarea({
	autoFocus,
	placeholder,
	className,
	value,
	onChange,
}: {
	autoFocus?: boolean;
	placeholder?: string;
	className?: string;
	value?: string;
	onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
	return (
		<textarea
			placeholder={placeholder}
			className={className}
			value={value}
			onChange={onChange}
		/>
	);
}

export function PromptInputTools({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return <div className={className}>{children}</div>;
}

// --- Provider / context stubs ---

const PromptInputContext = createContext<ReturnType<
	typeof usePromptInputController
> | null>(null);

export function PromptInputProvider({ children }: { children: ReactNode }) {
	return (
		<PromptInputContext.Provider value={usePromptInputController()}>
			{children}
		</PromptInputContext.Provider>
	);
}

export function usePromptInputAttachments() {
	return {
		files: [] as Array<{
			id: string;
			name: string;
			mediaType: string;
			url: string;
		}>,
		openFileDialog: () => {},
		clear: () => {},
	};
}

export function useProviderAttachments() {
	return {
		files: [] as Array<{
			id: string;
			name: string;
			mediaType: string;
			url: string;
			filename?: string;
		}>,
		takeFiles: () =>
			[] as Array<{
				id: string;
				name: string;
				mediaType: string;
				url: string;
				filename?: string;
			}>,
		clear: () => {},
	};
}

export function usePromptInputController() {
	return {
		textInput: {
			clear: () => {},
			focus: () => {},
			value: "",
			setInput: (_value: string) => {},
		},
		attachments: {
			clear: () => {},
		},
		files: [],
		addFiles: () => {},
		removeFile: () => {},
		clearFiles: () => {},
		submit: () => {},
	};
}
