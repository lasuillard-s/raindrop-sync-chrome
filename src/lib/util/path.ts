// TODO(lasuillard): Update codebase to use this Path class for path operations

const PathSeparator = '/';

/**
 * Represents a normalized path for bookmarks.
 */
export class Path {
	private pathSegments: string[];

	constructor(args: { fullPath?: string; segments?: string[] }) {
		if (args.fullPath && args.segments) {
			throw new Error('Cannot provide both fullPath and segments');
		}

		if (args.fullPath) {
			this.pathSegments = args.fullPath
				.split(PathSeparator)
				.filter((segment) => segment.length > 0);
		} else if (args.segments) {
			this.pathSegments = args.segments;
		}

		throw new Error('Either fullPath or segments must be provided');
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
	getFullPath(): string {
		return PathSeparator + this.pathSegments.join(PathSeparator);
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
