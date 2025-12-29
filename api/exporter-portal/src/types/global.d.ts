declare module 'pg' {
	export class Pool {
		constructor(config?: any);
		query(queryText: string, params?: any[]): Promise<any>;
		connect(): Promise<any>;
		end(): Promise<void>;
		on(event: string, handler: (...args: any[]) => void): void;
		totalCount?: number;
		idleCount?: number;
		waitingCount?: number;
	}
}

declare module 'uuid' {
	export function v4(): string;
}
