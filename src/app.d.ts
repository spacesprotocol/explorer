// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Request {
        validate<T extends ZodType>(schema: T): Promise<z.infer<T> & { errors?: Record<string, unknown> }>;
    }
}

export {};
