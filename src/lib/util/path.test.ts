import { describe, expect, it } from 'vitest';
import { Path, PathMap } from './path';

describe('Path', () => {
	it('constructs from segments correctly', () => {
		const path = new Path({ segments: ['folder', 'subfolder', 'file.txt'] });
		expect(path.getSegments()).toEqual(['folder', 'subfolder', 'file.txt']);
		expect(path.toString()).toBe('/folder/subfolder/file.txt');
	});

	it('constructs from string correctly', () => {
		const path = new Path({ pathString: '/folder/subfolder/file.txt' });
		expect(path.getSegments()).toEqual(['folder', 'subfolder', 'file.txt']);
		expect(path.toString()).toBe('/folder/subfolder/file.txt');
	});

	it('should provide either pathString or segments, not both', () => {
		expect(() => {
			new Path({});
		}).toThrow('Either pathString or segments must be provided');
		expect(() => {
			new Path({ pathString: '/folder/file.txt', segments: ['folder', 'file.txt'] });
		}).toThrow('Cannot provide both pathString and segments');
	});

	it('constructs from string correctly with escaped path separators in segments', () => {
		const path = new Path({ pathString: '/folder/subfolder\\/withslash/file.txt' });
		expect(path.getSegments()).toEqual(['folder', 'subfolder\\/withslash', 'file.txt']);
		expect(path.toString()).toBe('/folder/subfolder\\/withslash/file.txt');
	});

	it('reconstructs from string created by toString()', () => {
		const originalPath = new Path({ segments: ['folder', 'subfolder', 'file.txt'] });
		const pathString = originalPath.toString();
		const reconstructedPath = new Path({ pathString: pathString });
		expect(reconstructedPath.getSegments()).toEqual(originalPath.getSegments());
		expect(reconstructedPath.toString()).toBe(originalPath.toString());
	});

	it("root path should have no segments and has string representation '/'", () => {
		const rootPath = Path.root();
		expect(rootPath.getSegments()).toEqual([]);
		expect(rootPath.toString()).toBe('/');
	});

	it('getParent() should return correct parent paths', () => {
		const path = new Path({ pathString: '/folder/subfolder/file.txt' });
		const parentPath = path.getParent();
		expect(parentPath.getSegments()).toEqual(['folder', 'subfolder']);
		expect(parentPath.toString()).toBe('/folder/subfolder');
	});

	it('getParent() of root should return root', () => {
		const rootPath = Path.root();
		const parentPath = rootPath.getParent();
		expect(parentPath.getSegments()).toEqual([]);
		expect(parentPath.toString()).toBe('/');
	});

	it('joinPath() should join segments correctly', () => {
		const path = new Path({ pathString: '/folder' });
		const newPath = path.joinPath('subfolder', 'file.txt');
		expect(newPath.getSegments()).toEqual(['folder', 'subfolder', 'file.txt']);
		expect(newPath.toString()).toBe('/folder/subfolder/file.txt');
	});
});

describe('PathMap', () => {
	it('implements basic map functionality', () => {
		const pathMap = new PathMap<number>();
		const path1 = new Path({ pathString: '/folder/file1.txt' });
		const path2 = new Path({ pathString: '/folder/file2.txt' });

		pathMap.set(path1, 100);
		pathMap.set(path2, 200);

		expect(pathMap.get(path1)).toBe(100);
		expect(pathMap.get(path2)).toBe(200);
		expect(pathMap.has(path1)).toBe(true);
		expect(pathMap.has(new Path({ pathString: '/folder/file3.txt' }))).toBe(false);

		pathMap.delete(path1);
		expect(pathMap.has(path1)).toBe(false);
	});

	it('implements iteration over entries', () => {
		const pathMap = new PathMap<number>();
		const path1 = new Path({ pathString: '/folder/file1.txt' });
		const path2 = new Path({ pathString: '/folder/file2.txt' });

		pathMap.set(path1, 100);
		pathMap.set(path2, 200);

		const entries = Array.from(pathMap.entries());
		expect(entries).toEqual([
			[path1, 100],
			[path2, 200]
		]);
	});

	it('implements iteration over values', () => {
		const pathMap = new PathMap<number>();
		const path1 = new Path({ pathString: '/folder/file1.txt' });
		const path2 = new Path({ pathString: '/folder/file2.txt' });

		pathMap.set(path1, 100);
		pathMap.set(path2, 200);

		const values = Array.from(pathMap.values());
		expect(values).toEqual([100, 200]);
	});
});
