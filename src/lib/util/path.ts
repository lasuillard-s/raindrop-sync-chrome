/**
 * Represents a normalized path for bookmarks.
 */
export class Path {
	private pathSegments: string[];

	constructor(args: { pathString?: string; segments?: string[] }) {
		if (args.pathString && args.segments) {
			throw new Error('Cannot provide both pathString and segments');
		}

		let segments: string[];
		if (args.pathString) {
			segments = args.pathString.split(/(?<!\\)\//); // Split on unescaped slashes
		} else if (args.segments) {
			segments = args.segments;
		} else {
			throw new Error('Either pathString or segments must be provided');
		}

		// Strip leading empty segment if path starts with a slash
		if (segments.length > 1 && segments[0] === '') {
			segments = segments.slice(1);
		}

		this.pathSegments = segments;
	}

	static root(): Path {
		return new Path({ segments: [] });
	}

	/**
	 * Get the segments of the path.
	 * @returns An array of path segments.
	 */
	getSegments(): string[] {
		return [...this.pathSegments];
	}

	/**
	 * Get the full path as a string.
	 * @returns The full path string.
	 */
	toString(): string {
		return '/' + this.pathSegments.join('/');
	}

	/**
	 * Get the parent path.
	 * @returns The parent Path.
	 */
	getParent(): Path {
		if (this.pathSegments.length <= 1) {
			return Path.root();
		}
		const parentSegments = this.pathSegments.slice(0, -1);
		return new Path({ segments: parentSegments });
	}

	/**
	 * Join additional segments to the current path.
	 * @param segments The segments to join.
	 * @returns A new Path with the joined segments.
	 */
	joinPath(...segments: string[]): Path {
		const newSegments = [...this.pathSegments, ...segments];
		return new Path({ segments: newSegments });
	}
}

/**
 * A generic map where keys are Paths.
 */
export class PathMap<Value> {
	private map: Map<string, Value>;

	constructor() {
		this.map = new Map<string, Value>();
	}

	get(path: Path): Value | undefined {
		return this.map.get(path.toString());
	}

	set(path: Path, value: Value): void {
		this.map.set(path.toString(), value);
	}

	delete(path: Path): boolean {
		return this.map.delete(path.toString());
	}

	has(path: Path): boolean {
		return this.map.has(path.toString());
	}

	entries(): IterableIterator<[Path, Value]> {
		// NOTE: `this.map.entries().map(([key, value]) => [new Path({ pathString: key }), value])`
		//       will fail because Map's iterator does not have a `map` method.
		const iterator = this.map.entries();
		return {
			[Symbol.iterator]() {
				return this;
			},
			next(): IteratorResult<[Path, Value]> {
				const result = iterator.next();
				if (result.done) {
					return { done: true, value: undefined };
				}
				const [key, value] = result.value;
				return { done: false, value: [new Path({ pathString: key }), value] };
			}
		};
	}

	values(): IterableIterator<Value> {
		return this.map.values();
	}
}
