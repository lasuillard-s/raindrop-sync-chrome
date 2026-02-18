import { NodeData } from '~/lib/sync/tree';
import { faker } from '@faker-js/faker';

// NodeData implementation for testing
export class TestNodeData extends NodeData {
	private _id: string;
	private _parentId: string | null;
	private _name: string;
	private _url: string | null;
	private _isFolder: boolean;

	constructor(props: {
		id: string;
		parentId?: string | null;
		name?: string;
		url?: string | null;
		isFolder?: boolean;
	}) {
		super();
		this._id = props.id;
		this._parentId = props.parentId ?? null;
		this._name = props.name ?? faker.lorem.word();
		this._url = props.url ?? null;
		this._isFolder = props.isFolder ?? false;
	}

	getId(): string {
		return this._id;
	}
	getParentId(): string | null {
		return this._parentId;
	}
	getHash(): string {
		return this._id;
	}
	getName(): string {
		return this._name;
	}
	getUrl(): string | null {
		return this._url;
	}
	isFolder(): boolean {
		return this._isFolder;
	}
}
