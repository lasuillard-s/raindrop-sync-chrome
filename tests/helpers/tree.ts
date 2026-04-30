import { faker } from '@faker-js/faker';
import { TreeNode } from '@lib/sync';

export class TestTreeNode extends TreeNode {
	constructor(props: {
		id: string;
		title?: string;
		url?: string | null;
		type?: 'folder' | 'bookmark';
		raw?: unknown;
		parent?: TreeNode | null;
	}) {
		super({
			id: props.id,
			parent: null, // Parent will be set when building the tree (.addChild())
			title: props.title ?? faker.lorem.word(),
			url: props.url ?? null,
			type: props.type || 'bookmark',
			raw: props.raw ?? null
		});
		if (props.parent) {
			props.parent.addChild(this);
		}
	}

	getHash(): string {
		if (this.isFolder()) {
			return this.getPath().toString();
		}
		return this.getPath().toString() + '|' + (this.url || '');
	}
}
