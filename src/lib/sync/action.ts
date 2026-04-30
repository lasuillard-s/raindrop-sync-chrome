import type { Path } from '@lib/util/path';

export enum SyncActionType {
	CreateBookmark = 'create-bookmark',
	CreateFolder = 'create-folder',
	UpdateBookmark = 'update-bookmark',
	UpdateFolder = 'update-folder',
	Delete = 'delete'
}

export type SyncAction =
	| SyncActionCreateBookmark
	| SyncActionCreateFolder
	| SyncActionUpdateBookmark
	| SyncActionUpdateFolder
	| SyncActionDelete;

export abstract class SyncActionBase {
	abstract type: SyncActionType;
}

export interface SyncActionCreateBookmarkArgs {
	path: Path;
	url: string;
}
export class SyncActionCreateBookmark extends SyncActionBase {
	readonly type = SyncActionType.CreateBookmark;
	readonly args: SyncActionCreateBookmarkArgs;

	constructor(args: SyncActionCreateBookmarkArgs) {
		super();
		this.args = args;
	}
}

export interface SyncActionCreateFolderArgs {
	path: Path;
}
export class SyncActionCreateFolder extends SyncActionBase {
	readonly type = SyncActionType.CreateFolder;
	readonly args: SyncActionCreateFolderArgs;

	constructor(args: SyncActionCreateFolderArgs) {
		super();
		this.args = args;
	}
}

export interface SyncActionUpdateBookmarkArgs {
	id: string;
	title?: string;
	url?: string;
}
export class SyncActionUpdateBookmark extends SyncActionBase {
	readonly type = SyncActionType.UpdateBookmark;
	readonly args: SyncActionUpdateBookmarkArgs;

	constructor(args: SyncActionUpdateBookmarkArgs) {
		super();
		this.args = args;
	}
}

export interface SyncActionUpdateFolderArgs {
	id: string;
	title?: string;
}
export class SyncActionUpdateFolder extends SyncActionBase {
	readonly type = SyncActionType.UpdateFolder;
	readonly args: SyncActionUpdateFolderArgs;

	constructor(args: SyncActionUpdateFolderArgs) {
		super();
		this.args = args;
	}
}

export interface SyncActionDeleteArgs {
	id: string;
}
export class SyncActionDelete extends SyncActionBase {
	readonly type = SyncActionType.Delete;
	readonly args: SyncActionDeleteArgs;

	constructor(args: SyncActionDeleteArgs) {
		super();
		this.args = args;
	}
}
